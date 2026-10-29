# Migração do esquema de classificação

## Auditoria da planilha e do deployment

A cópia local inspecionada é `PLANILHA VSCODE (3).xlsx`; o arquivo identificado
anteriormente como `(1)` não está disponível nesta pasta. Durante esta
auditoria, também foram abertas as duas planilhas Google e o projeto Apps
Script usado pelo deployment.

Nas doze abas mensais, os cabeçalhos de classificação X:AJ estão na ordem
esperada pelo Apps Script. As colunas A:B e D:H também correspondem ao formato
que o script grava. A coluna C varia entre `PAGAMENTO`, `DESCRIÇÃO` e vazia;
o script grava C somente quando seu cabeçalho é `PAGAMENTO`, e mantém o
pagamento no campo de classificação AG para os outros formatos.

Foi encontrada uma inconsistência funcional na coluna G (`VALOR AJUSTADO`):
sete linhas com data e valor preenchidos não tinham fórmula: G2:G3 de
FEVEREIRO2026, G37 de SETEMBRO2026, G3 de OUTUBRO2026, G3 e G9 de
NOVEMBRO2026 e G5 de DEZEMBRO2026. A fórmula usada pela cópia é
`=IF(Bn="Saída",-ABS(Fn),ABS(Fn))`. Sem ela, resumos e análises que usam o
valor com sinal podem não refletir a movimentação.

O projeto Apps Script `FINANCE API` implantado na versão 51 aponta para a cópia
`10m0FTn8xru6bhF0eDvuqwiVerp8ym05IEf_gMaXvySc`
(`PLANILHA VSCODE (3) - corrigida`). O arquivo local agora usa o mesmo ID para
evitar que a próxima atualização do código passe a gravar em outra planilha.

Na aba `OUTUBRO2026` da planilha publicada, as linhas 58 e 59 têm ID, data,
tipo e fórmula de valor ajustado, mas não têm categoria, subcategoria nem
valor. As linhas incompletas não devem ser interpretadas como gravações
concluídas.

Após o usuário atualizar o Apps Script para a versão 51, as consultas reais
via API protegida retornaram respostas válidas para dashboard, histórico,
subcategorias, configurações e metas. O teste sintético de gravação falhou
explicitamente na linha 60 porque a validação de dados da coluna D aceita
somente valores já presentes em `D2:D276`; a categoria `Alimentação` não está
nessa lista. As colunas D e E têm regras legadas equivalentes. O Apps Script
deixou a linha 60 parcial e retornou o erro, sem confirmar sucesso.

O código local foi corrigido para salvar a classificação do contrato novo
somente nas colunas canônicas X:AJ, deixando D:E vazias para esse contrato e
mantendo a gravação legada em D:E para payloads antigos. Ele também ignora
linhas sem data, fluxo ou valor positivo no histórico, para que um ID parcial
não seja tratado como operação já concluída. A gravação ainda confirma os
valores e a fórmula após `SpreadsheetApp.flush()` e relata a etapa/células que
falharam. A Vercel e o frontend também foram endurecidos para não considerar
uma linha sem valor como confirmação e permitir retry do mesmo ID.

A linha sintética parcial 60 deve ser reparada por retry com o mesmo ID depois
que o Apps Script e o código Vercel atualizados forem implantados. Não a
apague antes de confirmar a reparação; a idempotência deve atualizar essa
mesma linha, sem criar duplicata.

Também foi criada a cópia `PLANILHA VSCODE (3) - corrigida.xlsx`, preservando
intacto o arquivo original. Somente as sete células G listadas acima receberam
fórmulas. A cópia foi reaberta no Excel e conferida: nenhuma linha de
movimentação com data e valor ficou sem fórmula em G.

Para concluir a correção, publique novamente `apps script.txt` no projeto
`FINANCE API`, mantendo `ID_PLANILHA` em `10m0FTn8xru6bhF0eDvuqwiVerp8ym05IEf_gMaXvySc`
e a URL `/exec` configurada na Vercel. Atualize também a função Vercel e o
frontend com as alterações locais. Não altere nem compartilhe o segredo.
Depois, use o botão de retry que ainda mantém a movimentação sintética aberta,
confirme que o ID foi reparado na linha 60 e confira data, fluxo, pagamento,
valor, fórmula, classificação em X:AJ e ausência de duplicata. Somente então
limpe a linha de teste identificada por sua observação exclusiva.

## Histórico da migração do esquema

Em cada uma das doze abas mensais, foram preenchidas somente as células
AI1:AJ1:

| Coluna | Cabeçalho |
|---|---|
| AI | `QUANTIDADE_PARCELAS_V2` |
| AJ | `NUMERO_PARCELA_V2` |

Na migração original, antes da gravação, foi confirmada a ausência de valores
e fórmulas em AI2:AJ em todas as abas. Nenhum registro foi movido ou
reclassificado. A auditoria atual confirma que os cabeçalhos permanecem
presentes.

Esta alteração foi feita somente em `PLANILHA VSCODE (3).xlsx`. O arquivo
`(1)` mencionado anteriormente não está disponível nesta pasta e não foi
alterado. Na planilha publicada, somente foi criada a linha sintética de teste
60, atualmente parcial e pendente de retry; nenhum registro preexistente foi
editado ou apagado.

## Reversão

Antes de reverter para uma versão antiga do Apps Script, restaure a cópia de
backup da planilha. Se necessário, remova apenas os cabeçalhos AI1:AJ1 das
abas mensais alteradas, depois de confirmar que nenhuma movimentação foi
gravada nessas colunas. Não remova as colunas inteiras, não altere G nem
AL:AM e não apague os dados históricos.

## Validação

Os testes automatizados verificam gravação e conferência dos campos,
classificação canônica sem depender das validações legadas D:E, reparo
idempotente de gravação incompleta, exclusão de linhas parciais do histórico,
gravação do valor e fórmula em G, reparo de fórmulas ausentes e rejeição de
cabeçalhos incompatíveis. A cópia XLSX local corrigida não apaga nem
reclassifica registros. A gravação corrigida ainda precisa ser publicada e
confirmada na planilha em produção.
