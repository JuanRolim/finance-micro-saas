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