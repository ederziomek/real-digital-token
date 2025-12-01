import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealDigital } from "../target/types/real_digital";
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, Keypair } from "@solana/web3.js";

/**
 * Script para emitir Real Digital após confirmar depósito PIX
 * 
 * Uso:
 * ts-node app/mint.ts <recipient_address> <amount_brl> <pix_transaction_id>
 * 
 * Exemplo:
 * ts-node app/mint.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU 100.50 PIX123456789
 */

async function main() {
  // Configuração
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealDigital as Program<RealDigital>;
  
  // Argumentos da linha de comando
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Uso: ts-node mint.ts <recipient> <amount_brl> <pix_id>");
    console.error("Exemplo: ts-node mint.ts 7xKXtg... 100.50 PIX123");
    process.exit(1);
  }

  const recipientAddress = new PublicKey(args[0]);
  const amountBRL = parseFloat(args[1]);
  const pixTransactionId = args[2];

  // Converte BRL para unidades do token (2 decimais)
  // Ex: 100.50 BRL = 10050 unidades
  const amount = Math.floor(amountBRL * 100);

  console.log("=".repeat(60));
  console.log("EMISSÃO DE REAL DIGITAL");
  console.log("=".repeat(60));
  console.log(`Destinatário: ${recipientAddress.toString()}`);
  console.log(`Valor: R$ ${amountBRL.toFixed(2)} (${amount} unidades)`);
  console.log(`Comprovante PIX: ${pixTransactionId}`);
  console.log("=".repeat(60));

  try {
    // Encontra PDAs
    const [reservePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("reserve")],
      program.programId
    );

    // Obtém o mint address (precisa ser criado primeiro com initialize)
    const mintAddress = await getMintAddress(program);

    // Cria ou obtém a conta de token associada do destinatário
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      recipientAddress
    );

    // Verifica se a conta existe, se não, cria
    const accountInfo = await provider.connection.getAccountInfo(recipientTokenAccount);
    if (!accountInfo) {
      console.log("Criando conta de token para o destinatário...");
      const createAccountIx = createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        recipientTokenAccount,
        recipientAddress,
        mintAddress
      );
      
      const tx = new anchor.web3.Transaction().add(createAccountIx);
      await provider.sendAndConfirm(tx);
      console.log("✓ Conta de token criada");
    }

    // Emite os tokens
    console.log("\nEmitindo tokens...");
    const tx = await program.methods
      .mintRealDigital(
        new anchor.BN(amount),
        pixTransactionId
      )
      .accounts({
        mint: mintAddress,
        reserve: reservePDA,
        recipient: recipientTokenAccount,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✓ Tokens emitidos com sucesso!");
    console.log(`Transação: ${tx}`);
    console.log(`Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    // Verifica o saldo
    const balance = await provider.connection.getTokenAccountBalance(recipientTokenAccount);
    console.log(`\nSaldo do destinatário: ${parseFloat(balance.value.amount) / 100} RD`);

    // Verifica o estado da reserva
    const reserve = await program.account.reserve.fetch(reservePDA);
    console.log(`\nTotal em circulação: ${reserve.totalSupply.toNumber() / 100} RD`);
    console.log(`Reserva BRL: R$ ${reserve.brlReserve.toNumber() / 100}`);
    console.log(`Total emitido (histórico): ${reserve.totalMinted.toNumber() / 100} RD`);

  } catch (error) {
    console.error("\n❌ Erro ao emitir tokens:");
    console.error(error);
    process.exit(1);
  }
}

async function getMintAddress(program: Program<RealDigital>): Promise<PublicKey> {
  // Esta função deve retornar o endereço do mint
  // Por simplicidade, vamos assumir que está armazenado ou você passa como argumento
  // Em produção, você guardaria isso em um arquivo de configuração
  
  // Placeholder - substitua pelo endereço real após initialize
  throw new Error("Configure o MINT_ADDRESS após executar initialize");
  // return new PublicKey("SEU_MINT_ADDRESS_AQUI");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
