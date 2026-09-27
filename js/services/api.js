/* ============================================
   CONFIGURAÇÃO DA API
============================================ */

const API_URL = "https://script.google.com/macros/s/AKfycbz-VqIj6iceldDkTl0Qf5TF5CEFggiIOyhBvDpBxth1qyZRBoORuTTzgmXZ8-uihEp7/exec";

/* ============================================
   ENVIAR MOVIMENTAÇÃO
============================================ */

async function salvarNaPlanilha(registro) {

    console.log("===== REGISTRO ENVIADO PARA API =====");
    console.log(registro);
    console.log(JSON.stringify(registro));

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

        console.log(
            "BODY ENVIADO:",
            formData.toString()
        );

        const resposta =
            await fetch(API_URL, {

                method: "POST",

                body: formData,

                headers: {
                    "Accept": "application/json"
                }

            });

        const textoResposta =
            await resposta.text();

        console.log(
            "RESPOSTA DO APPS SCRIPT:",
            textoResposta
        );

        if (!resposta.ok) {

            throw new Error(
                "HTTP " + resposta.status
            );

        }

        if (!textoResposta) {

            throw new Error(
                "Resposta vazia do Apps Script."
            );

        }

        const resultado =
            JSON.parse(textoResposta);

        if (!resultado.success) {

            throw new Error(
                resultado.message ||
                "Apps Script retornou erro."
            );

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
    try{
        const resposta = await fetch(
 
            API_URL + "?acao=subcategorias"
 
        );
 
       const textoResposta = await resposta.text();
 
       if (!textoResposta) {
 
           return [];
 
       }
 
       try {
 
           return JSON.parse(textoResposta);
 
       } catch (erro) {
 
           return [];
 
       }
 
   }catch(erro){
 
       console.error(erro);
 
       return [];
 
   }
 
}

async function obterDashboard(){
    const resposta = await fetch(
 
        API_URL + "?acao=dashboard&t=" + Date.now(),
 
        {
 
            cache:"no-store"
 
        }
 
    );
 
    const textoResposta = await resposta.text();
 
    if (!textoResposta) {
 
        return null;
 
    }
 
    try {
 
        return JSON.parse(textoResposta);
 
    } catch (erro) {
 
        return null;
 
    }
 
}

async function buscarMetas() {
    try {
        const resposta = await fetch(`${API_URL}?acao=metas`);

        if (!resposta.ok) {
            throw new Error("Erro ao consultar metas.");
        }

        const metas = await resposta.json();

        return metas;
    } catch (erro) {
        console.error("Erro ao buscar metas:", erro);
        throw erro;
    }
}

async function criarMeta(meta) {

    try {

        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                acao: "criarMeta",
                meta: JSON.stringify(meta)
            })
        });

        if (!resposta.ok) {
            throw new Error("Erro ao criar meta.");
        }

        const resultado = await resposta.json();

        return resultado;

    } catch (erro) {

        console.error("Erro ao criar meta:", erro);

        throw erro;

    }

}

async function encerrarMeta(idMeta) {
    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                acao: "encerrarMeta",
                idMeta: idMeta
            })
        });

        if (!resposta.ok) {
            throw new Error("Erro ao encerrar meta.");
        }

        const resultado = await resposta.json();

        return resultado;

    } catch (erro) {
        console.error("Erro ao encerrar meta:", erro);
        throw erro;
    }
}

async function concluirDesejo(idMeta) {

    try {

        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                acao: "concluirDesejo",
                idMeta: idMeta
            })
        });

        if (!resposta.ok) {
            throw new Error("Erro ao concluir desejo.");
        }

        const resultado = await resposta.json();

        return resultado;

    } catch (erro) {

        console.error("Erro ao concluir desejo:", erro);

        throw erro;
    }
}

async function transformarDesejoEmMeta(idMeta) {

    try {

        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                acao: "transformarDesejoEmMeta",
                idMeta: idMeta
            })
        });

        if (!resposta.ok) {
            throw new Error(
                "Erro ao transformar desejo em meta."
            );
        }

        const resultado = await resposta.json();

        return resultado;

    } catch (erro) {

        console.error(
            "Erro ao transformar desejo em meta:",
            erro
        );

        throw erro;
    }
}