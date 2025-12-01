# Guia de Início Rápido - Real Digital

Este guia vai te ajudar a configurar e testar o Real Digital em **menos de 10 minutos**.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Rust** 1.70+ ([Instalação](https://rustup.rs/))
- **Solana CLI** 1.17+ ([Instalação](https://docs.solana.com/cli/install-solana-cli-tools))
- **Anchor** 0.29+ ([Instalação](https://www.anchor-lang.com/docs/installation))

## Passo 1: Clone o Repositório

```bash
git clone https://github.com/ederziomek/real-digital-token.git
cd real-digital-token
```

## Passo 2: Instale Dependências

```bash
npm install
```

## Passo 3: Configure a Solana CLI

```bash
# Configure para usar a devnet (rede de testes)
solana config set --url devnet

# Crie uma carteira (se ainda não tiver)
solana-keygen new --outfile ~/.config/solana/id.json

# Solicite airdrop de SOL para pagar taxas
solana airdrop 2
```

## Passo 4: Build do Smart Contract

```bash
# Compile o programa Rust
anchor build
```

## Passo 5: Deploy na Devnet

```bash
# Faça deploy do smart contract
anchor deploy --provider.cluster devnet
```

**Importante:** Anote o **Program ID** que aparecerá no terminal. Você precisará dele.

## Passo 6: Atualize o Program ID

Edite os seguintes arquivos substituindo `RDxxxxxxxxxxx...` pelo Program ID real:

1. `Anchor.toml` (seção `[programs.devnet]`)
2. `program/src/lib.rs` (na linha `declare_id!`)

Depois, rebuild e redeploy:

```bash
anchor build
anchor deploy --provider.cluster devnet
```

## Passo 7: Inicialize o Token

```bash
# Execute o script de inicialização
anchor run initialize
```

Isso vai:
- Criar o mint do token RD
- Criar a conta de reserva
- Configurar você como autoridade

## Passo 8: Teste a Emissão (Mint)

```bash
# Emitir 100 RD para sua carteira
npm run mint $(solana address) 100 PIX_TEST_123
```

Você deve ver:
```
✓ Tokens emitidos com sucesso!
Transação: 5xKXt...
Saldo do destinatário: 100 RD
```

## Passo 9: Verifique a Reserva

```bash
npm run reserve
```

Saída esperada:
```
📊 ESTATÍSTICAS GERAIS
Total em Circulação:        100 RD
Reserva em BRL:             R$ 100
Taxa de Colateralização:    100.00%
Status do Contrato:         ✅ ATIVO
```

## Passo 10: Teste a Queima (Burn)

```bash
# Queimar 50 RD
npm run burn $(solana address) 50 "Banco 001, Ag 1234, CC 56789-0"
```

## 🎉 Parabéns!

Você configurou com sucesso o Real Digital! Agora você pode:

- ✅ Emitir tokens (mint)
- ✅ Queimar tokens (burn)
- ✅ Verificar a reserva
- ✅ Transferir entre carteiras

## Próximos Passos

### Para Desenvolvimento

1. **Integre com sua exchange:**
   - Adapte os scripts em `app/` para seu backend
   - Conecte com seu gateway de PIX
   - Implemente webhooks de confirmação

2. **Adicione testes:**
   ```bash
   anchor test
   ```

3. **Implemente multisig:**
   - Use Squads Protocol ou similar
   - Transfira autoridade para multisig

### Para Produção

1. **Auditoria de segurança:**
   - Contrate auditores (ex: Kudelski, Trail of Bits)
   - Implemente correções
   - Publique relatório

2. **Deploy em mainnet:**
   ```bash
   solana config set --url mainnet-beta
   anchor deploy --provider.cluster mainnet
   ```

3. **Configure monitoramento:**
   - Alertas de transações suspeitas
   - Dashboard de reserva em tempo real
   - Logs de auditoria

## Comandos Úteis

```bash
# Ver saldo de SOL
solana balance

# Ver endereço da carteira
solana address

# Ver logs do programa
solana logs <PROGRAM_ID>

# Ver transação
solana confirm <SIGNATURE> -v

# Pausar o contrato (emergência)
anchor run pause

# Retomar o contrato
anchor run unpause
```

## Troubleshooting

### Erro: "Insufficient funds"
```bash
solana airdrop 2
```

### Erro: "Program ID mismatch"
Certifique-se de atualizar o Program ID em:
- `Anchor.toml`
- `program/src/lib.rs`

### Erro: "Account not found"
Você precisa inicializar o token primeiro:
```bash
anchor run initialize
```

## Suporte

- 📖 [Documentação completa](./docs/)
- 🐛 [Reportar bug](https://github.com/ederziomek/real-digital-token/issues)
- 💬 [Discord](https://discord.gg/realdigital) (em breve)

---

**Dica:** Use a devnet para todos os testes. Só vá para mainnet após auditoria completa!
