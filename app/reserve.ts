import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealDigital } from "../target/types/real_digital";
import { PublicKey } from "@solana/web3.js";

/**
 * Script para verificar o estado da reserva Real Digital
 * 
 * Uso:
 * ts-node app/reserve.ts
 */

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RealDigital as Program<RealDigital>;

  try {
    const [reservePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("reserve")],
      program.programId
    );

    console.log("=".repeat(70));
    console.log("RELATÓRIO DE RESERVA - REAL DIGITAL");
    console.log("=".repeat(70));

    const reserve = await program.account.reserve.fetch(reservePDA);

    const totalSupply = reserve.totalSupply.toNumber() / 100;
    const brlReserve = reserve.brlReserve.toNumber() / 100;
    const totalMinted = reserve.totalMinted.toNumber() / 100;
    const totalBurned = reserve.totalBurned.toNumber() / 100;
    const collateralRatio = totalSupply > 0 ? (brlReserve / totalSupply) * 100 : 0;

    console.log("\n📊 ESTATÍSTICAS GERAIS");
    console.log("-".repeat(70));
    console.log(`Total em Circulação:        ${totalSupply.toLocaleString('pt-BR')} RD`);
    console.log(`Reserva em BRL:             R$ ${brlReserve.toLocaleString('pt-BR')}`);
    console.log(`Taxa de Colateralização:    ${collateralRatio.toFixed(2)}%`);
    console.log(`Status do Contrato:         ${reserve.isPaused ? '⏸️  PAUSADO' : '✅ ATIVO'}`);

    console.log("\n📈 HISTÓRICO");
    console.log("-".repeat(70));
    console.log(`Total Emitido (all-time):   ${totalMinted.toLocaleString('pt-BR')} RD`);
    console.log(`Total Queimado (all-time):  ${totalBurned.toLocaleString('pt-BR')} RD`);
    console.log(`Diferença (Supply):         ${(totalMinted - totalBurned).toLocaleString('pt-BR')} RD`);

    console.log("\n🔐 GOVERNANÇA");
    console.log("-".repeat(70));
    console.log(`Autoridade:                 ${reserve.authority.toString()}`);
    console.log(`Endereço da Reserva (PDA):  ${reservePDA.toString()}`);

    console.log("\n⚠️  VERIFICAÇÕES DE INTEGRIDADE");
    console.log("-".repeat(70));

    // Verificação 1: Supply = Minted - Burned
    const calculatedSupply = totalMinted - totalBurned;
    const supplyMatch = Math.abs(calculatedSupply - totalSupply) < 0.01;
    console.log(`Supply correto:             ${supplyMatch ? '✅' : '❌'} (${calculatedSupply.toFixed(2)} RD)`);

    // Verificação 2: Reserva = Supply (paridade 1:1)
    const reserveMatch = Math.abs(brlReserve - totalSupply) < 0.01;
    console.log(`Paridade 1:1:               ${reserveMatch ? '✅' : '❌'} (${(brlReserve - totalSupply).toFixed(2)} RD de diferença)`);

    // Verificação 3: Colateralização >= 100%
    const fullyCollateralized = collateralRatio >= 100;
    console.log(`Totalmente Lastreado:       ${fullyCollateralized ? '✅' : '❌'} (${collateralRatio.toFixed(2)}%)`);

    console.log("\n" + "=".repeat(70));

    if (!supplyMatch || !reserveMatch || !fullyCollateralized) {
      console.log("\n⚠️  ATENÇÃO: Inconsistências detectadas na reserva!");
      console.log("Recomenda-se auditoria imediata.");
      process.exit(1);
    } else {
      console.log("\n✅ Todas as verificações passaram. Reserva íntegra.");
    }

  } catch (error) {
    console.error("\n❌ Erro ao verificar reserva:");
    console.error(error);
    process.exit(1);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
