const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 8080;

// Middleware para processar JSON no body das requisições
app.use(express.json());

// Rota para processar o PIX
app.post("/api/process-pix", async (req, res) => {
  const { nome, cpf, valor } = req.body;

  // Validação dos dados de entrada
  if (!nome || !cpf || !valor) {
    return res.status(400).json({ message: "Dados incompletos ou inválidos." });
  }

  // Verifica se o valor é um número válido
  const valorNumerico = parseFloat(valor);
  if (isNaN(valorNumerico)) {
    return res.status(400).json({ message: "O valor deve ser um número válido." });
  }

  try {
    // Payload fixo com telefone e email
    const pixPayload = {
      "api-key": "1df48ad4-9171-475c-bf19-a12c446d8df1", // Chave da API
      amount: valor, // Valor já está no formato correto (string com duas casas decimais)
      client: {
        name: nome,
        document: cpf,
        telefone: "11985162400", // Telefone fixo
        email: "privacymelmaia@gmail.com", // Email fixo
      },
      utms: {
        utm_source: "google", // Exemplo de UTM
        utm_medium: "cpc",
        utm_campaign: "promocao_novembro",
        utm_term: "comprar+produto",
        utm_content: "banner_lateral",
      },
    };

    console.log("Payload enviado para a BytePay:", JSON.stringify(pixPayload, null, 2));

    // Faz a requisição para a API da BytePay
    const response = await axios.post("https://api.bytepaycash.com/v1/gateway/", pixPayload);

    console.log("Resposta completa da BytePay:", JSON.stringify(response.data, null, 2));

    // Verifica se a resposta da API foi bem-sucedida
    if (response.data?.status === "success") {
      const { paymentCode, idTransaction, paymentCodeBase64 } = response.data;

      // Verifica se o paymentCode está presente
      if (!paymentCode) {
        console.error("Código PIX não encontrado na resposta:", response.data);
        return res.status(500).json({ message: "Código PIX não encontrado na resposta." });
      }

      // Verifica se os demais campos estão presentes
      if (!idTransaction || !paymentCodeBase64) {
        console.error("Dados incompletos na resposta da BytePay:", response.data);
        return res.status(500).json({ message: "Resposta incompleta da API BytePay." });
      }

      // Retorna os dados do PIX gerado
      return res.status(200).json({
        status: "success",
        message: "Pix gerado com sucesso!",
        paymentCode,
        idTransaction,
        paymentCodeBase64,
      });
    } else {
      // Se a API retornar um erro
      console.error("Erro na API BytePay:", response.data);
      return res.status(400).json({ message: "Erro ao gerar Pix", details: response.data });
    }
  } catch (error) {
    // Tratamento de erros
    console.error("Erro ao chamar a API BytePay:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    if (error.response) {
      console.error("Resposta de erro da BytePay:", error.response.data);
      console.error("Status do erro:", error.response.status);
      console.error("Headers do erro:", error.response.headers);
    } else if (error.request) {
      console.error("Não houve resposta da BytePay:", error.request);
    } else {
      console.error("Erro ao configurar a requisição:", error.message);
    }

    return res.status(500).json({
      message: "Erro ao processar Pix.",
      error: error.response?.data || error.message,
    });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
