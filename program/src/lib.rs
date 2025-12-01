use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};

declare_id!("RDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod real_digital {
    use super::*;

    /// Inicializa o token Real Digital e a conta de reserva
    pub fn initialize(
        ctx: Context<Initialize>,
        decimals: u8,
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        reserve.authority = ctx.accounts.authority.key();
        reserve.total_supply = 0;
        reserve.brl_reserve = 0;
        reserve.total_minted = 0;
        reserve.total_burned = 0;
        reserve.is_paused = false;
        reserve.bump = *ctx.bumps.get("reserve").unwrap();
        
        msg!("Real Digital inicializado com {} decimais", decimals);
        msg!("Autoridade: {}", reserve.authority);
        
        Ok(())
    }

    /// Emite (mint) novos tokens Real Digital
    /// Só pode ser chamado pela autoridade após confirmar depósito BRL
    pub fn mint_real_digital(
        ctx: Context<MintRealDigital>,
        amount: u64,
        deposit_proof: String, // ID da transação PIX
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        
        // Verificações de segurança
        require!(!reserve.is_paused, ErrorCode::ContractPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(amount <= 1_000_000_00, ErrorCode::AmountTooLarge); // Max 1M por transação
        
        // Atualiza contadores da reserva
        reserve.total_supply = reserve.total_supply.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        reserve.brl_reserve = reserve.brl_reserve.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        reserve.total_minted = reserve.total_minted.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        
        // Emite os tokens
        let seeds = &[
            b"reserve".as_ref(),
            &[reserve.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient.to_account_info(),
            authority: ctx.accounts.reserve.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, amount)?;
        
        msg!("Emitidos {} RD para {}", amount, ctx.accounts.recipient.key());
        msg!("Comprovante PIX: {}", deposit_proof);
        msg!("Total em circulação: {} RD", reserve.total_supply);
        
        Ok(())
    }

    /// Queima (burn) tokens Real Digital
    /// Chamado quando usuário solicita saque
    pub fn burn_real_digital(
        ctx: Context<BurnRealDigital>,
        amount: u64,
        withdrawal_address: String, // Conta bancária do usuário
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        
        // Verificações
        require!(!reserve.is_paused, ErrorCode::ContractPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(reserve.total_supply >= amount, ErrorCode::InsufficientSupply);
        
        // Atualiza contadores
        reserve.total_supply = reserve.total_supply.checked_sub(amount)
            .ok_or(ErrorCode::Underflow)?;
        reserve.brl_reserve = reserve.brl_reserve.checked_sub(amount)
            .ok_or(ErrorCode::Underflow)?;
        reserve.total_burned = reserve.total_burned.checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        
        // Queima os tokens
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.holder.to_account_info(),
            authority: ctx.accounts.holder_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::burn(cpi_ctx, amount)?;
        
        msg!("Queimados {} RD de {}", amount, ctx.accounts.holder.key());
        msg!("Saque para conta: {}", withdrawal_address);
        msg!("Total em circulação: {} RD", reserve.total_supply);
        
        Ok(())
    }

    /// Pausa o contrato em caso de emergência
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        reserve.is_paused = true;
        msg!("Contrato pausado pela autoridade");
        Ok(())
    }

    /// Retoma operações do contrato
    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        reserve.is_paused = false;
        msg!("Contrato retomado pela autoridade");
        Ok(())
    }

    /// Transfere autoridade para novo endereço
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let reserve = &mut ctx.accounts.reserve;
        let old_authority = reserve.authority;
        reserve.authority = new_authority;
        
        msg!("Autoridade transferida de {} para {}", old_authority, new_authority);
        Ok(())
    }
}

// ============================================================================
// Contexts (estruturas de contas)
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = 2,
        mint::authority = reserve,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + Reserve::LEN,
        seeds = [b"reserve"],
        bump
    )]
    pub reserve: Account<'info, Reserve>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintRealDigital<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump,
        has_one = authority,
    )]
    pub reserve: Account<'info, Reserve>,
    
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnRealDigital<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump,
    )]
    pub reserve: Account<'info, Reserve>,
    
    #[account(mut)]
    pub holder: Account<'info, TokenAccount>,
    
    pub holder_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump,
        has_one = authority,
    )]
    pub reserve: Account<'info, Reserve>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump,
        has_one = authority,
    )]
    pub reserve: Account<'info, Reserve>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [b"reserve"],
        bump = reserve.bump,
        has_one = authority,
    )]
    pub reserve: Account<'info, Reserve>,
    pub authority: Signer<'info>,
}

// ============================================================================
// State (estruturas de dados)
// ============================================================================

#[account]
pub struct Reserve {
    /// Autoridade que pode emitir/queimar tokens
    pub authority: Pubkey,
    
    /// Total de tokens em circulação
    pub total_supply: u64,
    
    /// Reserva em BRL (em centavos, ex: 10000 = R$ 100,00)
    pub brl_reserve: u64,
    
    /// Total de tokens já emitidos (histórico)
    pub total_minted: u64,
    
    /// Total de tokens já queimados (histórico)
    pub total_burned: u64,
    
    /// Se o contrato está pausado
    pub is_paused: bool,
    
    /// Bump seed para PDA
    pub bump: u8,
}

impl Reserve {
    pub const LEN: usize = 32 + // authority
                           8 +  // total_supply
                           8 +  // brl_reserve
                           8 +  // total_minted
                           8 +  // total_burned
                           1 +  // is_paused
                           1;   // bump
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Contrato está pausado")]
    ContractPaused,
    
    #[msg("Quantidade inválida")]
    InvalidAmount,
    
    #[msg("Quantidade muito grande (max 1M por transação)")]
    AmountTooLarge,
    
    #[msg("Supply insuficiente")]
    InsufficientSupply,
    
    #[msg("Overflow na operação")]
    Overflow,
    
    #[msg("Underflow na operação")]
    Underflow,
}
