import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealDigital } from "../target/types/real_digital";
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

/**
 * Script para queimar Real Digital quando usuário solicita saque
 * 
 * Uso:
 * ts-node app/burn.ts <holder_address> <amount_brl> <bank_account>
 * 
 * Exemplo:
 * ts-node app/burn.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 50.00 "Banco 001, Ag 1234, CC 56789-0"
 */

async function main() {
  // Configuração
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealDigital as Program<RealDigital>;
  
  // Argumentos
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Uso: ts-node burn.ts <holder> <amount_brl> <bank_account>");
    console.error("Exemplo: ts-node burn.ts 7xKXtg... 50.00 'Banco 001, Ag 1234'");
    process.exit(1);
  }

  const holderAddress = new PublicKey(args[0]);
  const amountBRL = parseFloat(args[1]);
  const bankAccount = args[2];

  // Converte BRL para unidades do token
  const amount = Math.floor(amountBRL * 100);

  console.log("=".repeat(60));
  console.log("QUEIMA DE REAL DIGITAL (SAQUE)");
  console.log("=".repeat(60));
  console.log(`Titular: ${holderAddress.toString()}`);
  console.log(`Valor: R$ ${amountBRL.toFixed(2)} (${amount} unidades)`);
  console.log(`Conta bancária: ${bankAccount}`);
  console.log("=".repeat(60));

  try {
    // PDAs
    const [reservePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("reserve")],
      program.programId
    );

    const mintAddress = await getMintAddress(program);

    // Conta de token do titular
    const holderTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      holderAddress
    );

    // Verifica saldo antes de queimar
    const balanceBefore = await provider.connection.getTokenAccountBalance(holderTokenAccount);
    const balanceAmount = parseFloat(balanceBefore.value.amount);
    
    console.log(`\nSaldo atual: ${balanceAmount / 100} RD`);
    
    if (balanceAmount < amount) {
      throw new Error(`Saldo insuficiente. Necessário: ${amount / 100} RD, Disponível: ${balanceAmount / 100} RD`);
    }

    // Queima os tokens
    console.log("\nQueimando tokens...");
    const tx = await program.methods
      .burnRealDigital(
        new anchor.BN(amount),
        bankAccount
      )
      .accounts({
        mint: mintAddress,
        reserve: reservePDA,
        holder: holderTokenAccount,
        holderAuthority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✓ Tokens queimados com sucesso!");
    console.log(`Transação: ${tx}`);
    console.log(`Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    // Verifica saldo após queima
    const balanceAfter = await provider.connection.getTokenAccountBalance(holderTokenAccount);
    console.log(`\nNovo saldo: ${parseFloat(balanceAfter.value.amount) / 100} RD`);

    // Estado da reserva
    const reserve = await program.account.reserve.fetch(reservePDA);
    console.log(`\nTotal em circulação: ${reserve.totalSupply.toNumber() / 100} RD`);
    console.log(`Reserva BRL: R$ ${reserve.brlReserve.toNumber() / 100}`);
    console.log(`Total queimado (histórico): ${reserve.totalBurned.toNumber() / 100} RD`);

    console.log("\n⚠️  AÇÃO NECESSÁRIA:");
    console.log(`Enviar R$ ${amountBRL.toFixed(2)} via PIX para: ${bankAccount}`);

  } catch (error) {
    console.error("\n❌ Erro ao queimar tokens:");
    console.error(error);
    process.exit(1);
  }
}

async function getMintAddress(program: Program<RealDigital>): Promise<PublicKey> {
  // Placeholder - configure após initialize
  throw new Error("Configure o MINT_ADDRESS após executar initialize");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
