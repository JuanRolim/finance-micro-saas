# Migração do esquema de classificação

## Auditoria da cópia disponível

A cópia inspecionada é `PLANILHA VSCODE (3).xlsx`; o arquivo identificado
anteriormente como `(1)` não está disponível nesta pasta. As doze abas mensais
de 2026 usam X:AH para os primeiros onze campos da classificação. Os dois
campos finais esperados pelo Apps Script — quantidade e número da parcela —
estão ausentes em AI:AJ. A inspeção das doze abas confirmou que AI:AJ não
contém valores nem fórmulas.

As fórmulas existentes na coluna G e no resumo AL:AM foram preservadas. A
configuração em `CATEGORIASCONFIGS!M:R` e o mapa histórico em `T:X` também não
foram alterados.

## Alteração executada na cópia local

Em cada uma das doze abas mensais, foram preenchidas somente as células
AI1:AJ1:

| Coluna | Cabeçalho |
|---|---|
| AI | `QUANTIDADE_PARCELAS_V2` |
| AJ | `NUMERO_PARCELA_V2` |

Antes da gravação, foi confirmada a ausência de valores e fórmulas em AI2:AJ
em todas as abas. Nenhum registro foi movido ou reclassificado. Após salvar,
os novos cabeçalhos foram conferidos e as contagens de fórmulas em G e AL:AM
permaneceram iguais às anteriores em todas as abas.

Esta alteração foi feita somente em `PLANILHA VSCODE (3).xlsx`. O arquivo
`(1)` mencionado anteriormente não está disponível nesta pasta e não foi
alterado. A planilha publicada no Google Sheets também não foi acessada.

## Reversão

Antes de reverter para uma versão antiga do Apps Script, restaure a cópia de
backup da planilha. Se necessário, remova apenas os cabeçalhos AI1:AJ1 das
abas mensais alteradas, depois de confirmar que nenhuma movimentação foi
gravada nessas colunas. Não remova as colunas inteiras, não altere G nem
AL:AM e não apague os dados históricos.

## Validação pós-migração

Após a alteração, confira que cada aba mensal contém os treze cabeçalhos X:AJ
em ordem, que os valores e fórmulas anteriores continuam intactos e que a
implantação atualizada do Apps Script consegue ler e salvar uma movimentação.
O teste de salvamento em produção deve ser feito somente com autorização e
com uma movimentação que possa ser removida de forma segura.
