/* ============================================
   CONFIGURAÇÃO DA API
============================================ */

const API_URL = window.location.protocol === "file:"
   ? "http://127.0.0.1:8000/api"
   : "/api";
/* ============================================
   ENVIAR MOVIMENTAÇÃO
============================================ */

async function salvarNaPlanilha(registro){
 
    try{
 
        const formData = new URLSearchParams();
 
        formData.append(
            "registro",
            JSON.stringify(registro)
        );
 
        const resposta = await fetch(API_URL,{
 
            method:"POST",
 
            body: formData,
 
            headers: {
 
                "Accept": "application/json"
 
            }
 
        });
 
        if (!resposta.ok) {
 
            throw new Error("Falha ao salvar na planilha.");
 
        }
 
        const textoResposta = await resposta.text();
 
        let resultado = null;
 
        if (textoResposta) {
 
            try {
 
                resultado = JSON.parse(textoResposta);
 
            } catch (erro) {
 
                resultado = textoResposta;
 
            }
 
        }
 
        console.log(resultado);
 
        return resultado;
 
    }catch(erro){
 
        console.error(erro);
 
        alert("Erro ao conectar com a planilha.");
 
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