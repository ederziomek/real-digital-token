# Real Digital (RD) 🇧🇷

**Stablecoin brasileira lastreada 1:1 com o Real (BRL) na blockchain Solana**

## 📋 Visão Geral

Real Digital é uma stablecoin descentralizada que mantém paridade 1:1 com o Real brasileiro (BRL). Construída na blockchain Solana para garantir transações rápidas e custos ultra baixos.

### Características Principais

- ✅ **Paridade 1:1**: 1 RD = 1 BRL sempre
- ✅ **Custo baixíssimo**: ~R$ 0,001 por transação
- ✅ **Velocidade**: Confirmação em 3 segundos
- ✅ **Transparência**: Reserva auditável
- ✅ **Padrão SPL**: Compatível com todas as carteiras Solana

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Cliente       │
│  (Deposita BRL) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Exchange      │
│ (Confirma PIX)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smart Contract  │
│ (Emite RD)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Carteira Solana │
│ (Recebe RD)     │
└─────────────────┘
```

## 🔐 Mecanismo de Paridade

A paridade 1 RD = 1 BRL é mantida através de 3 pilares:

### 1. Controle de Emissão
- Apenas a autoridade pode emitir (mint) novos tokens
- Emissão só ocorre após confirmação de depósito BRL
- Sistema de reserva verifica saldo antes de emitir

### 2. Reserva Transparente
- Cada Real Digital emitido tem 1 BRL em reserva
- Relatórios públicos de auditoria
- Prova de reserva verificável

### 3. Recompra Garantida
- Sempre é possível trocar RD por BRL
- Taxa de saque transparente
- Liquidez garantida

## 📦 Estrutura do Projeto

```
real-digital-token/
├── program/              # Smart contract Solana (Rust)
│   ├── src/
│   │   ├── lib.rs       # Programa principal
│   │   ├── state.rs     # Estados do contrato
│   │   └── instructions.rs
│   └── Cargo.toml
├── app/                  # Aplicação de gerenciamento
│   ├── mint.ts          # Script de emissão
│   ├── burn.ts          # Script de queima
│   └── reserve.ts       # Controle de reserva
├── sdk/                  # SDK para integração
│   └── typescript/
├── docs/                 # Documentação
│   ├── WHITEPAPER.md
│   ├── API.md
│   └── SECURITY.md
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Rust 1.70+
- Solana CLI 1.17+
- Anchor Framework 0.29+

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/ederziomek/real-digital-token.git
cd real-digital-token

# 2. Instale dependências
npm install

# 3. Configure a rede Solana
solana config set --url devnet

# 4. Crie uma carteira (se não tiver)
solana-keygen new

# 5. Solicite airdrop (testnet)
solana airdrop 2
```

### Deploy do Token

```bash
# 1. Build do programa
cd program
cargo build-bpf

# 2. Deploy na devnet
solana program deploy target/deploy/real_digital.so

# 3. Inicialize o token
npm run initialize
```

## 💻 Uso Básico

### Emitir Real Digital (Mint)

```typescript
import { mintRealDigital } from './sdk';

// Após confirmar depósito de R$ 100 via PIX
await mintRealDigital({
  authority: authorityKeypair,
  recipient: userWalletAddress,
  amount: 100_00, // 100 BRL (2 decimais)
  depositProof: pixTransactionId
});
```

### Queimar Real Digital (Burn)

```typescript
import { burnRealDigital } from './sdk';

// Quando usuário solicita saque
await burnRealDigital({
  authority: authorityKeypair,
  holder: userWalletAddress,
  amount: 50_00, // 50 BRL
  withdrawalAddress: userBankAccount
});
```

### Verificar Reserva

```typescript
import { getReserveBalance } from './sdk';

const reserve = await getReserveBalance();
console.log(`Total em circulação: ${reserve.totalSupply} RD`);
console.log(`Reserva BRL: R$ ${reserve.brlReserve}`);
console.log(`Taxa de colateralização: ${reserve.collateralRatio}%`);
```

## 📊 Informações do Token

| Propriedade | Valor |
|-------------|-------|
| **Nome** | Real Digital |
| **Símbolo** | RD |
| **Decimais** | 2 |
| **Blockchain** | Solana |
| **Padrão** | SPL Token |
| **Tipo** | Stablecoin |
| **Lastro** | BRL (Real Brasileiro) |

## 🔒 Segurança

- ✅ Auditoria de smart contract (pendente)
- ✅ Multisig para operações críticas
- ✅ Timelock para mudanças de autoridade
- ✅ Limite de emissão por transação
- ✅ Sistema de pausar em emergência

## 📈 Roadmap

### Fase 1: MVP (Atual)
- [x] Smart contract básico
- [x] Sistema de mint/burn
- [x] Controle de reserva
- [ ] Deploy em devnet

### Fase 2: Beta
- [ ] Auditoria de segurança
- [ ] Interface web para gerenciamento
- [ ] Integração com exchange
- [ ] Deploy em mainnet

### Fase 3: Produção
- [ ] Listagem em DEXs (Raydium, Orca)
- [ ] Integração com carteiras
- [ ] API pública
- [ ] Relatórios de auditoria mensais

### Fase 4: Expansão
- [ ] Governança DAO
- [ ] Pools de liquidez
- [ ] Integração com DeFi
- [ ] Suporte multi-chain

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de enviar PRs.

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

## ⚠️ Disclaimer

Real Digital é um projeto experimental. Não é afiliado ao Banco Central do Brasil ou ao Real Digital oficial. Use por sua conta e risco.

## 📞 Contato

- **Website**: (em breve)
- **Twitter**: (em breve)
- **Discord**: (em breve)
- **Email**: contato@realdigital.io

---

**Construído com ❤️ no Brasil 🇧🇷**
