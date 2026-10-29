const GET_ACTIONS = new Set([
    "dashboard",
    "historico",
    "subcategorias",
    "configuracoes",
    "metas"
]);

const POST_ACTION_FIELDS = {
    movimentacao: "registro",
    criarMeta: "meta",
    encerrarMeta: "idMeta",
    concluirDesejo: "idMeta",
    transformarDesejoEmMeta: "idMeta",
    gerenciarClassificacao: "classificacao"
};

const MAX_BODY_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 25000;
const SECRET_FIELD = "_sharedSecret";
const OPERATION_ID_FIELD = "idOperacao";

function responder(res, status, payload) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
}

function sameOriginRequest(req) {
    const origin = req.headers.origin;
    if (!origin) return req.method === "GET";
    if (origin === "null") return false;

    const host = req.headers.host;
    if (!host) return false;
    const protocol = String(req.headers["x-forwarded-proto"] || "https")
        .split(",")[0]
        .trim();

    try {
        return new URL(origin).origin === `${protocol}://${host}`;
    } catch {
        return false;
    }
}

function parseJsonObject(value, field) {
    let parsed;
    try {
        parsed = JSON.parse(value);
    } catch {
        throw new RequestError(`O campo ${field} contém JSON inválido.`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new RequestError(`O campo ${field} deve ser um objeto.`);
    }
    return parsed;
}

class RequestError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "RequestError";
        this.statusCode = statusCode;
    }
}

class UpstreamUncertainError extends Error {
    constructor(message, statusCode = 502) {
        super(message);
        this.name = "UpstreamUncertainError";
        this.statusCode = statusCode;
        this.outcomeUnknown = true;
    }
}

async function lerFormulario(req) {
    const contentType = String(req.headers["content-type"] || "")
        .split(";")[0]
        .trim()
        .toLowerCase();
    if (contentType !== "application/x-www-form-urlencoded") {
        throw new RequestError(
            "Use o formato application/x-www-form-urlencoded.",
            415
        );
    }

    const chunks = [];
    let tamanho = 0;
    for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        tamanho += buffer.length;
        if (tamanho > MAX_BODY_BYTES) {
            throw new RequestError("A requisição excede o tamanho permitido.", 413);
        }
        chunks.push(buffer);
    }
    return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function validarPedidoPost(form) {
    const acao = form.get("acao") || "movimentacao";
    const campo = POST_ACTION_FIELDS[acao];
    if (!campo) {
        throw new RequestError("Ação de gravação não permitida.");
    }

    for (const chave of form.keys()) {
        if (chave !== "acao" && chave !== campo &&
            chave !== OPERATION_ID_FIELD) {
            throw new RequestError("A requisição contém parâmetros não permitidos.");
        }
    }
    if (form.getAll("acao").length > 1 ||
        form.getAll(campo).length !== 1 ||
        form.getAll(OPERATION_ID_FIELD).length > 1) {
        throw new RequestError("A requisição contém parâmetros duplicados ou ambíguos.");
    }

    const idOperacao = form.get(OPERATION_ID_FIELD);
    if (typeof idOperacao !== "string" ||
        !/^[A-Za-z0-9._:-]{8,200}$/.test(idOperacao)) {
        throw new RequestError("A operação precisa de um identificador estável.");
    }

    const valor = form.get(campo);
    if (!valor) {
        throw new RequestError(`O campo ${campo} é obrigatório.`);
    }

    if (campo === "registro") {
        const registro = parseJsonObject(valor, campo);
        if (typeof registro.idMovimentacao !== "string" ||
            !registro.idMovimentacao.trim() ||
            registro.idMovimentacao.length > 200) {
            throw new RequestError("A movimentação precisa de um identificador estável.");
        }
        if (registro.idMovimentacao !== idOperacao) {
            throw new RequestError("O ID da operação não corresponde ao ID da movimentação.");
        }
    } else if (campo === "meta" || campo === "classificacao") {
        const objeto = parseJsonObject(valor, campo);
        if (campo === "classificacao" && ![
            "criar-categoria",
            "renomear-categoria",
            "adicionar-subcategoria",
            "renomear-subcategoria"
        ].includes(objeto.operacao)) {
            throw new RequestError("Operação de classificação não permitida.");
        }
    } else if (valor.length > 200) {
        throw new RequestError(`O campo ${campo} excede o tamanho permitido.`);
    }

    return { acao, campo, valor, idOperacao };
}

function obterConfiguracaoUpstream() {
    const configurada = process.env.APPS_SCRIPT_URL;
    if (!configurada) {
        throw new Error("A variável APPS_SCRIPT_URL não está configurada.");
    }
    const url = new URL(configurada);
    if (url.protocol !== "https:" ||
        url.hostname !== "script.google.com" ||
        !url.pathname.endsWith("/exec")) {
        throw new Error("A URL do Apps Script não é uma implantação HTTPS /exec válida.");
    }
    const segredo = process.env.APPS_SCRIPT_SHARED_SECRET;
    if (!segredo || Buffer.byteLength(segredo, "utf8") < 32) {
        throw new Error("A credencial privada do Apps Script não está configurada corretamente.");
    }
    return { url, segredo };
}

function criarFormularioUpstream(req, acao, form) {
    const parametros = new URLSearchParams();
    parametros.set("acao", acao);

    if (req.method === "GET") {
        if (acao === "subcategorias") {
            for (const chave of ["categoria", "natureza"]) {
                const valor = req.query && req.query[chave];
                if (typeof valor === "string" && valor.length <= 120) {
                    parametros.set(chave, valor);
                }
            }
        }
        return parametros;
    }

    for (const [chave, valor] of form.entries()) {
        if (chave !== "acao") parametros.append(chave, valor);
    }
    return parametros;
}

function validarRespostaConsulta(acao, dados) {
    if (acao === "historico" || acao === "subcategorias" ||
        acao === "metas") {
        if (!Array.isArray(dados)) {
            throw new Error(
                `O Apps Script retornou um formato inválido para ${acao}.`
            );
        }
        return;
    }

    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw new Error(
            `O Apps Script retornou um formato inválido para ${acao}.`
        );
    }

    if (acao === "dashboard") {
        const campos = [
            "saldo",
            "entrada",
            "saida",
            "essencial",
            "naoEssencial",
            "investimentos",
            "sonhos"
        ];
        if (!campos.every((campo) =>
            typeof dados[campo] === "number" && Number.isFinite(dados[campo])
        )) {
            throw new Error(
                "O Apps Script retornou dados incompletos ou inválidos para o dashboard."
            );
        }
        return;
    }

    if (acao === "configuracoes" &&
        (!Array.isArray(dados.classificacoes) ||
            !Array.isArray(dados.fluxos) ||
            !Array.isArray(dados.naturezas))) {
        throw new Error(
            "O Apps Script retornou configurações incompletas ou inválidas."
        );
    }
}

async function verificarMovimentacaoNoHistorico(url, segredo, idMovimentacao) {
    const parametros = new URLSearchParams({
        acao: "historico",
        [SECRET_FIELD]: segredo
    });
    const resposta = await fetch(url, {
        method: "POST",
        redirect: "follow",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: parametros.toString(),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    if (!resposta.ok) {
        throw new Error(
            `A consulta de confirmação respondeu com HTTP ${resposta.status}.`
        );
    }

    const dados = JSON.parse(await resposta.text());
    if (!Array.isArray(dados)) {
        throw new Error("O histórico retornou um formato inválido.");
    }
    return dados.some((item) =>
        item && item.idMovimentacao === idMovimentacao
    );
}

async function chamarAppsScript(req, acao, form, operacaoDeEscrita) {
    const { url, segredo } = obterConfiguracaoUpstream();
    const formularioUpstream = criarFormularioUpstream(req, acao, form);
    formularioUpstream.set(SECRET_FIELD, segredo);
    const opcoes = {
        method: "POST",
        redirect: "follow",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: formularioUpstream.toString(),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    };

    let resposta;
    try {
        resposta = await fetch(url, opcoes);
    } catch (erro) {
        const timeout = erro.name === "TimeoutError" || erro.name === "AbortError";
        throw new UpstreamUncertainError(
            operacaoDeEscrita && timeout
                ? "O Apps Script demorou demais para responder."
                : timeout
                    ? "A consulta ao Apps Script demorou demais para responder."
                    : operacaoDeEscrita
                        ? "Não foi possível obter uma resposta do Apps Script."
                        : "Não foi possível consultar o Apps Script.",
            timeout ? 504 : 502
        );
    }
    let texto;
    try {
        texto = await resposta.text();
    } catch (erro) {
        if (operacaoDeEscrita) {
            throw new UpstreamUncertainError(
                "Não foi possível ler a confirmação do Apps Script."
            );
        }
        throw new Error("Não foi possível ler a resposta do Apps Script.", {
            cause: erro
        });
    }
    let dados;
    try {
        dados = JSON.parse(texto);
    } catch {
        const idMovimentacao = operacaoDeEscrita &&
            acao === "movimentacao" && form
            ? form.get(OPERATION_ID_FIELD)
            : null;
        if (idMovimentacao) {
            try {
                const confirmada = await verificarMovimentacaoNoHistorico(
                    url,
                    segredo,
                    idMovimentacao
                );
                if (confirmada) {
                    return {
                        success: true,
                        idMovimentacao,
                        confirmadaNoHistorico: true
                    };
                }
            } catch (erro) {
                console.error(
                    "Não foi possível confirmar a movimentação no histórico:",
                    erro.name,
                    erro.message
                );
            }
        }
        throw new UpstreamUncertainError(
            operacaoDeEscrita
                ? "O Apps Script retornou uma resposta inválida após a gravação."
                : "O Apps Script retornou uma resposta inválida."
        );
    }

    if (dados && dados.success === false && dados.outcomeUnknown === true) {
        throw new UpstreamUncertainError(
            typeof dados.message === "string"
                ? dados.message
                : "O Apps Script não conseguiu confirmar o resultado da operação."
        );
    }

    if (!resposta.ok && operacaoDeEscrita) {
        throw new UpstreamUncertainError(
            `O Apps Script respondeu com HTTP ${resposta.status} durante a gravação.`
        );
    }

    if (!resposta.ok || (dados && dados.success === false)) {
        const erro = new Error(
            dados && typeof dados.message === "string"
                ? dados.message
                : `O Apps Script respondeu com HTTP ${resposta.status}.`
        );
        erro.statusCode = 502;
        throw erro;
    }
    if (!operacaoDeEscrita) validarRespostaConsulta(acao, dados);
    return dados;
}

module.exports = async function financeApi(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method !== "GET" && req.method !== "POST") {
        res.setHeader("Allow", "GET, POST");
        return responder(res, 405, { success: false, message: "Método não permitido." });
    }

    if (!sameOriginRequest(req)) {
        return responder(res, 403, { success: false, message: "Origem da requisição não permitida." });
    }

    try {
        if (req.method === "GET") {
            const acao = req.query && req.query.acao;
            if (typeof acao !== "string" || !GET_ACTIONS.has(acao)) {
                throw new RequestError("Ação de consulta não permitida.");
            }
            const dados = await chamarAppsScript(req, acao, null, false);
            return responder(res, 200, dados);
        }

        const form = await lerFormulario(req);
        const pedido = validarPedidoPost(form);
        const dados = await chamarAppsScript(
            req, pedido.acao, form, true
        );
        return responder(res, 200, dados);
    } catch (erro) {
        const status = erro instanceof RequestError
            ? erro.statusCode
            : Number.isInteger(erro.statusCode)
                ? erro.statusCode
                : erro.name === "TimeoutError" || erro.name === "AbortError"
                    ? 504
                    : 502;
        const outcomeUnknown = erro instanceof UpstreamUncertainError &&
            req.method === "POST";
        const message = erro instanceof RequestError
            ? erro.message
            : outcomeUnknown
                ? `${erro.message} ${req.method === "POST" ? "O resultado da gravação é desconhecido." : ""}`.trim()
                : erro.message || "Falha ao consultar o serviço financeiro.";
        console.error("Falha na API financeira:", erro.name, message);
        return responder(res, status, {
            success: false,
            message,
            ...(outcomeUnknown ? { outcomeUnknown: true } : {})
        });
    }
};

module.exports.config = {
    api: {
        bodyParser: false
    }
};
