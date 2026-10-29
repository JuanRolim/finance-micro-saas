/* ============================================
   CONFIGURAÇÃO DA API
============================================ */

const API_PATH = "/api/finance";

let configuracoesClassificacaoPromise = null;

function construirUrlApi(parametros = {}) {
    if (typeof window === "undefined" || !window.location?.href) {
        const erro = new Error(
            "Não foi possível determinar o endereço do aplicativo. Abra-o por HTTP ou HTTPS."
        );
        erro.name = "ApiConfigurationError";
        throw erro;
    }

    let pagina;
    try {
        pagina = new URL(window.location.href);
    } catch {
        const erro = new Error(
            "O endereço atual do aplicativo é inválido. Abra o endereço publicado ou inicie o servidor local."
        );
        erro.name = "ApiConfigurationError";
        throw erro;
    }

    if (pagina.protocol === "file:") {
        const erro = new Error(
            "O aplicativo foi aberto diretamente pelo arquivo (file://), mas a API exige HTTP ou HTTPS. Abra o endereço publicado ou inicie o ambiente local com `npx vercel dev`."
        );
        erro.name = "ApiConfigurationError";
        throw erro;
    }
    if (pagina.protocol !== "http:" && pagina.protocol !== "https:") {
        const erro = new Error(
            "A API exige que o aplicativo seja aberto por HTTP ou HTTPS."
        );
        erro.name = "ApiConfigurationError";
        throw erro;
    }

    const url = new URL(API_PATH, pagina);
    for (const [chave, valor] of Object.entries(parametros)) {
        if (valor !== undefined && valor !== null) {
            url.searchParams.set(chave, String(valor));
        }
    }
    return url.toString();
}

function invalidarConfiguracoesClassificacao() {
    configuracoesClassificacaoPromise = null;
}

async function lerRespostaApi(resposta, metodo = "GET") {
    const escrita = metodo.toUpperCase() === "POST";
    if (resposta.status === 404) {
        const erro = new Error(
            "A rota /api/finance não existe neste servidor. Use `npx vercel dev` localmente ou implante a função da Vercel."
        );
        erro.name = "ApiRouteNotFoundError";
        throw erro;
    }

    function erroDeResultadoDesconhecido(detalhe = "") {
        const erro = new Error(
            `${detalhe ? `${detalhe} ` : ""}A API não confirmou o resultado da gravação. Verifique o histórico antes de tentar novamente.`
        );
        erro.name = "ApiOutcomeUnknownError";
        return erro;
    }

    function erroDeServidorIndisponivel(detalhe = "") {
        const erro = new Error(
            detalhe || "O servidor da API está indisponível. Verifique a implantação e tente novamente."
        );
        erro.name = "ApiServerUnavailableError";
        return erro;
    }

    const texto = await resposta.text();
    if (!texto) {
        if (!resposta.ok && resposta.status >= 500) {
            throw escrita
                ? erroDeResultadoDesconhecido()
                : erroDeServidorIndisponivel();
        }
        if (escrita && resposta.ok) {
            throw erroDeResultadoDesconhecido();
        }
        const erro = new Error("A API retornou uma resposta vazia.");
        erro.name = "ApiResponseError";
        throw erro;
    }

    let dados;
    try {
        dados = JSON.parse(texto);
    } catch {
        if (escrita && (resposta.ok || resposta.status >= 500)) {
            throw erroDeResultadoDesconhecido();
        }
        if (!resposta.ok && resposta.status >= 500) {
            throw erroDeServidorIndisponivel();
        }
        const erro = new Error("A API retornou uma resposta inválida.");
        erro.name = "ApiResponseError";
        throw erro;
    }

    if (dados && dados.outcomeUnknown === true) {
        const erro = new Error(
            dados.message || "O resultado da operação é desconhecido."
        );
        erro.name = "ApiOutcomeUnknownError";
        throw erro;
    }
    if (!resposta.ok && resposta.status >= 500) {
        const detalhe = dados && typeof dados.message === "string"
            ? dados.message
            : "";
        throw escrita
            ? erroDeResultadoDesconhecido(detalhe)
            : erroDeServidorIndisponivel(detalhe);
    }
    if (dados && dados.success === false) {
        const erro = new Error(dados.message || "A API retornou um erro do backend.");
        erro.name = "ApiBackendError";
        throw erro;
    }
    if (!resposta.ok) {
        const erro = new Error(
            dados && dados.message
                ? dados.message
                : `Falha na API (HTTP ${resposta.status}).`
        );
        erro.name = "ApiHttpError";
        throw erro;
    }

    return dados;
}

async function requisitarApi(url, opcoes) {
    const escrita = String(opcoes?.method || "GET").toUpperCase() === "POST";
    try {
        return await fetch(url, opcoes);
    } catch (erro) {
        const erroRede = new Error(
            escrita
                ? "Não foi possível conectar à API. A confirmação da gravação é desconhecida; verifique o histórico antes de tentar novamente."
                : "Não foi possível conectar à API. Verifique se o servidor local está ativo ou tente novamente mais tarde."
        );
        erroRede.name = escrita ? "ApiNetworkError" : "ApiConnectionError";
        erroRede.cause = erro;
        throw erroRede;
    }
}

function obterConfiguracoesClassificacao() {
    if (!configuracoesClassificacaoPromise) {
        configuracoesClassificacaoPromise = requisitarApi(
            construirUrlApi({ acao: "configuracoes" }),
            { cache: "no-store" }
        )
            .then(lerRespostaApi)
            .then((dados) => {
                if (!dados || !Array.isArray(dados.classificacoes) || !dados.classificacoes.length) {
                    throw new Error("A API não retornou categorias configuradas.");
                }

                return dados;
            })
            .catch((erro) => {
                configuracoesClassificacaoPromise = null;
                throw erro;
            });
    }

    return configuracoesClassificacaoPromise;
}

/* ============================================
   ENVIAR MOVIMENTAÇÃO
============================================ */

async function salvarNaPlanilha(registro) {

    try {

        if (!registro) {

            throw new Error(
                "Registro está vazio antes do envio."
            );

        }

        const formData =
            new URLSearchParams();

        formData.append(
            "registro",
            JSON.stringify(registro)
        );
        formData.append("idOperacao", registro.idMovimentacao);

        const resposta =
            await requisitarApi(construirUrlApi(), {

                method: "POST",

                body: formData,

                headers: {
                    "Accept": "application/json"
                }

            });

        const resultado = await lerRespostaApi(resposta, "POST");
        if (
            !resultado ||
            resultado.success !== true ||
            resultado.idMovimentacao !== registro.idMovimentacao
        ) {
            const erroConfirmacao = new Error(
                "O serviço não confirmou o identificador da movimentação salva."
            );
            erroConfirmacao.name = "ApiOutcomeUnknownError";
            throw erroConfirmacao;
        }
        return resultado;

    } catch (erro) {

        console.error(
            "Erro ao salvar na planilha:",
            erro
        );

        throw erro;

    }

}

/* ============================================
   OBTER SUBCATEGORIAS
============================================ */

async function obterSubcategorias(){
    const resposta = await requisitarApi(
        construirUrlApi({ acao: "subcategorias" }),
        { cache: "no-store" }
    );
    const dados = await lerRespostaApi(resposta);
    if (!Array.isArray(dados)) {
        throw new Error("A API retornou uma lista de subcategorias inválida.");
    }
    return dados;
}

async function obterDashboard(){
    const resposta = await requisitarApi(
        construirUrlApi({ acao: "dashboard", t: Date.now() }),
        { cache: "no-store" }
    );
    return lerRespostaApi(resposta);
}

async function obterHistorico(){
    const resposta = await requisitarApi(
        construirUrlApi({ acao: "historico", t: Date.now() }),
        { cache: "no-store" }
    );
    const dados = await lerRespostaApi(resposta);
    if (!Array.isArray(dados)) {
        throw new Error("A API retornou um histórico inválido.");
    }
    return dados;
}

async function buscarMetas() {
    const resposta = await requisitarApi(
        construirUrlApi({ acao: "metas", t: Date.now() }),
        { cache: "no-store" }
    );
    const metas = await lerRespostaApi(resposta);
    if (!Array.isArray(metas)) {
        throw new Error("A API retornou uma lista de metas inválida.");
    }
    return metas;
}

async function enviarFormularioApi(parametros, operacao) {
    const parametrosComId = new URLSearchParams(parametros);
    const acao = parametrosComId.get("acao");
    const idOperacao = await obterIdOperacaoEstavel(acao, parametrosComId);
    parametrosComId.set("idOperacao", idOperacao);
    const resposta = await requisitarApi(construirUrlApi(), {
        method: "POST",
        body: parametrosComId,
        headers: { Accept: "application/json" }
    });
    const resultado = await lerRespostaApi(resposta, "POST");
    if (!resultado || resultado.success !== true) {
        throw new Error(
            resultado?.message || `O serviço não confirmou ${operacao}.`
        );
    }
    limparIdOperacaoEstavel(acao, idOperacao);
    return resultado;
}

async function obterIdOperacaoEstavel(acao, parametros) {
    if (!acao || typeof sessionStorage === "undefined" ||
        typeof crypto === "undefined" || !crypto.subtle) {
        const erro = new Error(
            "Este navegador não oferece armazenamento seguro para identificar a operação. Abra o app pelo domínio HTTPS da Vercel."
        );
        erro.name = "ApiIdempotencyStorageError";
        throw erro;
    }

    const conteudo = JSON.stringify(
        Array.from(parametros.entries())
            .filter(([chave]) => chave !== "idOperacao")
            .sort(([chaveA], [chaveB]) => chaveA.localeCompare(chaveB))
    );
    const bytes = new TextEncoder().encode(`${acao}:${conteudo}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
    const chave = `finance:pending-operation:${acao}:${fingerprint}`;

    try {
        let idOperacao = sessionStorage.getItem(chave);
        if (!idOperacao) {
            idOperacao = gerarIdUnico();
            sessionStorage.setItem(chave, idOperacao);
        }
        return idOperacao;
    } catch (causa) {
        const erro = new Error(
            "Não foi possível preservar o identificador da operação nesta sessão; nenhuma gravação foi enviada."
        );
        erro.name = "ApiIdempotencyStorageError";
        erro.cause = causa;
        throw erro;
    }
}

function limparIdOperacaoEstavel(acao, idOperacao) {
    try {
        const prefixo = `finance:pending-operation:${acao}:`;
        for (let indice = 0; indice < sessionStorage.length; indice++) {
            const chave = sessionStorage.key(indice);
            if (chave && chave.startsWith(prefixo) &&
                sessionStorage.getItem(chave) === idOperacao) {
                sessionStorage.removeItem(chave);
                return;
            }
        }
    } catch (erro) {
        console.warn(
            "A operação foi confirmada; o identificador pendente permaneceu armazenado nesta sessão.",
            erro
        );
    }
}

async function salvarClassificacao(classificacao) {
    const resultado = await enviarFormularioApi({
        acao: "gerenciarClassificacao",
        classificacao: JSON.stringify(classificacao)
    }, "a alteração da classificação");
    if (!Array.isArray(resultado.classificacoes)) {
        throw new Error("A API confirmou a alteração, mas não retornou as classificações atualizadas.");
    }
    invalidarConfiguracoesClassificacao();
    return resultado;
}

async function criarMeta(meta) {
    return enviarFormularioApi({
        acao: "criarMeta",
        meta: JSON.stringify(meta)
    }, "a criação da meta");
}

async function encerrarMeta(idMeta) {
    return enviarFormularioApi({
        acao: "encerrarMeta",
        idMeta
    }, "o encerramento da meta");
}

async function concluirDesejo(idMeta) {
    return enviarFormularioApi({
        acao: "concluirDesejo",
        idMeta
    }, "a conclusão do desejo");
}

async function transformarDesejoEmMeta(idMeta) {
    return enviarFormularioApi({
        acao: "transformarDesejoEmMeta",
        idMeta
    }, "a transformação do desejo em meta");
}