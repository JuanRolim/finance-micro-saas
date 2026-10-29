# Aplicativo financeiro protegido na Vercel

## Arquitetura e fronteiras de confiança

O navegador envia todas as consultas e gravações para `/api/finance` na mesma
origem HTTPS do app. A função [api/finance.js](../api/finance.js) valida ações
e campos permitidos e encaminha **todas** as operações ao Apps Script por
POST. O segredo servidor-a-servidor é adicionado somente nessa função, no corpo
URL-encoded; não é aceito do navegador, não vai na URL nem deve ser registrado.

O Apps Script valida `_sharedSecret` contra a propriedade de script
`APPS_SCRIPT_SHARED_SECRET` antes de atender leituras ou escritas. O `doGet`
legado não retorna dados; consultas autenticadas usam `doPost`. A implantação
do Apps Script precisa continuar acessível à função Vercel sem login Google,
pois a função não possui uma sessão Google. A proteção dos dados, nesse
endpoint público, depende da verificação do segredo forte no Apps Script.

A verificação de `Origin` na função é apenas uma defesa CSRF adicional; não é
autenticação. **Ative Vercel Authentication para All Deployments**, inclusive
produção, para que visitantes sem acesso não alcancem nem o HTML nem a função.
Essa configuração é feita no painel Vercel e não é ativada pelo código deste
repositório.

## Implantação segura (ordem necessária)

Faça backup do projeto Apps Script e da planilha antes da publicação. O arquivo
local `apps script.txt` não atualiza sozinho o código publicado.

1. Gere um segredo novo de 32 bytes aleatórios em uma máquina confiável. No
   PowerShell, execute e copie o valor diretamente para os dois painéis
   privados; não o salve no repositório, em arquivo de frontend, ticket ou log:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. No editor do Apps Script, publique o conteúdo atualizado de
   `apps script.txt`. Em **Project Settings → Script Properties**, configure
   `APPS_SCRIPT_SHARED_SECRET` com o segredo recém-gerado.
3. Crie uma **nova implantação** do tipo Web app. Configure **Execute as: Me**
   e acesso que permita chamadas não autenticadas do servidor Vercel (em geral
   **Anyone**). O endpoint público só deve liberar dados após conferir o
   segredo; essa propriedade precisa ser configurada antes de publicar/testar.
   Copie a nova URL `/exec`.
4. No painel Vercel, configure estas variáveis privadas para Production e para
   cada ambiente Preview que será usado:
   - `APPS_SCRIPT_URL`: URL `/exec` da nova implantação.
   - `APPS_SCRIPT_SHARED_SECRET`: exatamente o mesmo segredo armazenado nas
     Script Properties.
5. Em **Project → Settings → Deployment Protection**, habilite
   **Vercel Authentication** com escopo **All Deployments**. Confirme que sua
   conta tem acesso ao projeto. A proteção deve incluir a rota `/api/finance`.
6. Faça um novo deployment Vercel para aplicar as variáveis e a proteção.
7. Teste o deployment protegido e a nova implantação Apps Script conforme a
   seção de validação abaixo. Só depois de confirmar ambos, abra a lista
   **Deploy → Manage deployments** do Apps Script e revogue/arquive a
   implantação anterior que aceitava chamadas sem o segredo. Não a revogue
   antes da migração, para não interromper o app atual.

O Apps Script adiciona `ID_OPERACAO_API` na coluna I da aba `METAS` quando ela
está vazia e reserva a coluna S da tabela de classificação para essa mesma
finalidade. Se essas colunas já contiverem dados ou cabeçalhos diferentes, o
script interrompe a operação sem sobrescrevê-los; revise a aba e faça backup
antes de resolver o conflito.

## Validação de acesso e integridade

Automatizados localmente:

- A função encaminha consultas e gravações como POST, mantém o segredo fora da
  URL e falha fechada quando a variável não está configurada.
- O Apps Script rejeita chamadas sem segredo e não fornece consultas por GET.
- O proxy rejeita ações/formatos não permitidos e escritas sem ID estável.
- Consultas não aceitam apenas HTTP 200: o proxy confere o formato das
  respostas de dashboard, histórico, subcategorias, configurações e metas.
- O `doPost` retorna diretamente o `TextOutput` das consultas do Apps Script,
  evitando serializar novamente a resposta JSON.
- Se a resposta de uma gravação de movimentação vier ilegível, a Vercel
  consulta o histórico autenticado pelo mesmo ID estável antes de informar
  resultado desconhecido. Se o registro já estiver na planilha, a API confirma
  a gravação sem reenviá-la nem criar duplicidade.
- Movimentações (incluindo parcelas) usam seus IDs de registro; criação de
  metas persiste o ID da operação na própria linha; atualizações de estado e
  classificações repetidas são tratadas como estado desejado.
- O frontend mantém a mesma chave de idempotência na sessão após uma resposta
  incerta e não envia retry automático.

Esses testes **não** provam que a Vercel, o Apps Script ou a planilha publicados
estão configurados corretamente. Depois do deploy, use apenas dados sintéticos
claramente identificados:

1. Em janela anônima, abra o domínio de produção. Deve aparecer a autenticação
   Vercel; confirme que não é possível carregar o app nem chamar
   `/api/finance` sem autenticação.
2. Entre com sua conta Vercel e confira no Network que todas as consultas
   usam o domínio HTTPS do app e `/api/finance`.
3. Abra diretamente a URL `/exec` recém-publicada sem `_sharedSecret` e
   confirme resposta `success: false` / `Não autorizado.`; repita com valor
   inválido. Não inclua o segredo em URL ou console.
4. Consulte dashboard, histórico, metas, configurações e subcategorias pelo
   app autenticado. Confirme que dashboard/configurações retornam objetos com
   os campos esperados e que histórico, metas e subcategorias retornam arrays;
   HTTP 200 com `{}` deve ser tratado como erro, não como consulta válida.
5. Registre uma receita, uma despesa e uma despesa parcelada com observação
   identificável de teste. Confirme na planilha os IDs, os campos e a
   quantidade de linhas; repita a mesma operação com os mesmos IDs e confirme
   que não surgiram duplicatas.
6. Confirme histórico e dashboard depois das gravações. Remova os registros de
   teste apenas quando puder identificar com certeza as linhas criadas.
7. Teste novamente o domínio anônimo e a API após a implantação.
8. Após sucesso, revogue a implantação Apps Script antiga e verifique outra
   vez que a URL antiga não expõe os dados.

Na verificação de produção, o painel Vercel mostrou Vercel Authentication
habilitada para **All Deployments** e as variáveis `APPS_SCRIPT_URL` e
`APPS_SCRIPT_SHARED_SECRET` configuradas para Production (os valores não foram
exibidos nem copiados). As cinco consultas reais autenticadas responderam HTTP
200, mas todas retornaram `{}`, confirmando que a resposta vazia estava sendo
tratada como sucesso. A correção descrita neste documento foi aplicada apenas
nos arquivos locais; ainda é necessário publicá-la e repetir as consultas.

Uma requisição de gravação com data deliberadamente inválida foi usada para
verificar o caminho POST sem alterar a planilha; o Apps Script retornou o erro
de validação em JSON. Isso não valida a gravação bem-sucedida. Não houve
gravação de teste na planilha real. A recuperação pelo histórico e a
confirmação de gravação bem-sucedida precisam ser verificadas após a publicação
das alterações locais; não se deve declarar a integração pronta antes disso.
