document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro');
    const menu = document.getElementById('menu');
    const confirmacao = document.getElementById('confirmacao');
    const enterBtn = document.getElementById('enter-btn');
    const backBtn = document.getElementById('back-to-intro');

    enterBtn.addEventListener('click', () => {
        intro.classList.remove('active');
        menu.classList.add('active');
    });

    backBtn.addEventListener('click', () => {
        confirmacao.classList.remove('active');
        intro.classList.add('active');
    });

    let descontoAplicado = 0;
    let tipoDesconto = null;

    const cuponsValidos = {
        "10": { valor: 10, tipo: "porcentagem" }
    };

    const carrinho = {};
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    const notificacao = document.createElement('div');
    notificacao.id = 'notificacao';
    notificacao.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #4CAF50; color: white;
        padding: 12px 20px; border-radius: 8px;
        z-index: 1000; display: none; font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    `;
    document.body.appendChild(notificacao);

    function mostrarNotificacao(mensagem) {
        notificacao.textContent = mensagem;
        notificacao.style.display = 'block';
        setTimeout(() => notificacao.style.display = 'none', 2200);
    }

    function updateCart() {
        cartItems.innerHTML = '';
        let totalItens = 0;
        let valorTotal = 0;

        const nomesItens = Object.keys(carrinho);

        let indice = 0;
        while (indice < nomesItens.length) {
            const nome = nomesItens[indice];
            const item = carrinho[nome];

            if (item && item.qty > 0) {
                totalItens += item.qty;
                valorTotal += item.price * item.qty;

                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${nome} × ${item.qty} — R$ ${(item.price * item.qty).toFixed(2)}</span>
                    <div class="cart-controls">
                        <button class="qty-btn decrease" data-item="${nome}">-</button>
                        <span class="qty-display">${item.qty}</span>
                        <button class="qty-btn increase" data-item="${nome}">+</button>
                        <button class="remove-all-btn" data-item="${nome}">Remover</button>
                    </div>
                `;
                cartItems.appendChild(li);
            }

            indice++;
        }

        let valorFinal = valorTotal;
        if (descontoAplicado > 0) {
            const descontoCalc = tipoDesconto === 'porcentagem' 
                ? (valorTotal * descontoAplicado) / 100 
                : descontoAplicado;
            valorFinal = Math.max(0, valorTotal - descontoCalc);
        }

        cartCount.textContent = totalItens;
        cartTotal.textContent = valorFinal.toFixed(2);

        document.querySelectorAll('.qty-btn.increase').forEach(btn => {
            btn.onclick = () => increaseQty(btn.dataset.item);
        });

        document.querySelectorAll('.qty-btn.decrease').forEach(btn => {
            btn.onclick = () => decreaseQty(btn.dataset.item);
        });

        document.querySelectorAll('.remove-all-btn').forEach(btn => {
            btn.onclick = () => removeAll(btn.dataset.item);
        });
    }

    function increaseQty(nome) {
        if (carrinho[nome]) {
            carrinho[nome].qty++;
            updateCart();
        }
    }

    function decreaseQty(nome) {
        if (carrinho[nome]) {
            carrinho[nome].qty--;
            if (carrinho[nome].qty <= 0) {
                delete carrinho[nome];
            }
            updateCart();
        }
    }

    function removeAll(nome) {
        if (carrinho[nome]) {
            delete carrinho[nome];
            updateCart();
        }
    }

    function addToCart(nome, preco) {
        if (carrinho[nome]) {
            carrinho[nome].qty++;
        } else {
            carrinho[nome] = { qty: 1, price: preco };
        }
        updateCart();
        mostrarNotificacao("Adicionado ao pedido ✓");
    }

    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemElement = btn.closest('.item');
            const nome = itemElement.dataset.item;
            const preco = parseFloat(itemElement.dataset.price);
            addToCart(nome, preco);
        });
    });

    document.getElementById('aplicar-cupom').addEventListener('click', () => {
        const codigo = document.getElementById('cupom').value.trim().toUpperCase();
        const msgEl = document.getElementById('mensagem-cupom');

        if (cuponsValidos[codigo]) {
            descontoAplicado = cuponsValidos[codigo].valor;
            tipoDesconto = cuponsValidos[codigo].tipo;
            msgEl.style.color = 'green';
            msgEl.textContent = `Cupom de ${descontoAplicado}${tipoDesconto === 'porcentagem' ? '%' : ' reais'} aplicado com sucesso 🎉`;
        } else {
            descontoAplicado = 0;
            tipoDesconto = null;
            msgEl.style.color = 'red';
            msgEl.textContent = 'Cupom inválido ❌';
        }
        updateCart();
    });

    document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const forma = radio.value;
            document.getElementById('dados-cartao').style.display = forma === 'cartao' ? 'block' : 'none';
            document.getElementById('qrcode-pix').style.display = forma === 'pix' ? 'block' : 'none';
            document.getElementById('tipo-cartao').style.display = forma === 'cartao' ? 'block' : 'none';
        });
    });

    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (Object.keys(carrinho).length === 0) {
            alert('⚠️ Seu pedido está vazio!');
            return;
        }

        const endereco = document.getElementById('endereco').value.trim();
        if (endereco.length < 10) {
            alert('Informe um endereço completo.');
            return;
        }

        const pagamentoSelecionado = document.querySelector('input[name="pagamento"]:checked');
        const formaPagamento = pagamentoSelecionado?.value === 'pix' ? 'Pix' : 'Cartão';

        let resumo = '📋 RESUMO DO PEDIDO:\n\n';
        let total = 0;

        const nomes = Object.keys(carrinho);
        let i = 0;
        while (i < nomes.length) {
            const nome = nomes[i];
            const item = carrinho[nome];
            if (item.qty > 0) {
                const subtotal = item.price * item.qty;
                total += subtotal;
                resumo += `• ${nome} × ${item.qty} = R$ ${subtotal.toFixed(2)}\n`;
            }
            i++;
        }

        let valorFinal = total;
        let desconto = 0;
        if (descontoAplicado > 0) {
            desconto = tipoDesconto === 'porcentagem' ? (total * descontoAplicado) / 100 : descontoAplicado;
            valorFinal = total - desconto;
        }

        resumo += `\nEndereço:\n${endereco}\n`;
        if (desconto > 0) resumo += `Desconto: -R$ ${desconto.toFixed(2)}\n`;
        resumo += `Forma de pagamento: ${formaPagamento}\n`;
        resumo += `\n💰 TOTAL: R$ ${valorFinal.toFixed(2)}\n\n`;

        if (formaPagamento === 'Cartão') {
            const numero = document.getElementById('numero-cartao').value.trim();
            const nomeCartao = document.getElementById('nome-cartao').value.trim();
            const validade = document.getElementById('validade-cartao').value.trim();
            const cvv = document.getElementById('cvv-cartao').value.trim();

            if (!numero || !nomeCartao || !validade || !cvv) {
                alert('Preencha todos os dados do cartão para continuar.');
                return;
            }

            const tipoCartao = document.querySelector('input[name="tipo-cartao"]:checked')?.value || 'não informado';
            resumo += `Cartão: ${tipoCartao === 'debito' ? 'Débito' : 'Crédito'}\n`;
        } else {
            resumo += 'Pagamento via Pix (QR Code acima).\n';
        }

        if (confirm(resumo + '\n\nDeseja confirmar o pedido?')) {
            let mensagemFinal = `✅ Pedido confirmado!\n\nEndereço: ${endereco}\nTotal: R$ ${valorFinal.toFixed(2)}`;

            if (formaPagamento === 'Pix') {
                mensagemFinal += '\n\nAguarde a confirmação do pagamento via Pix.';
            } else {
                const tipoCartao = document.querySelector('input[name="tipo-cartao"]:checked')?.value || 'não informado';
                mensagemFinal += `\n\nPagamento via cartão (${tipoCartao === 'debito' ? 'Débito' : 'Crédito'}) processado com sucesso!`;
            }

            alert(mensagemFinal);

            Object.keys(carrinho).forEach(k => delete carrinho[k]);
            descontoAplicado = 0;
            tipoDesconto = null;
            document.getElementById('cupom').value = '';
            document.getElementById('endereco').value = '';
            document.getElementById('numero-cartao').value = '';
            document.getElementById('nome-cartao').value = '';
            document.getElementById('validade-cartao').value = '';
            document.getElementById('cvv-cartao').value = '';
            document.getElementById('mensagem-cupom').textContent = '';
            updateCart();

            menu.classList.remove('active');
            confirmacao.classList.add('active');
        }
    });

    const estrelas = document.querySelectorAll('#estrelas-avaliacao .estrela');
    const enviarBtn = document.getElementById('enviar-avaliacao');
    const listaAvaliacoes = document.getElementById('lista-avaliacoes');
    let notaSelecionada = 0;

    estrelas.forEach(estrela => {
        estrela.addEventListener('click', () => {
            notaSelecionada = parseInt(estrela.dataset.valor);
            estrelas.forEach((e, index) => e.classList.toggle('ativa', index < notaSelecionada));
        });

        estrela.addEventListener('mouseover', () => {
            const valor = parseInt(estrela.dataset.valor);
            estrelas.forEach((e, index) => e.classList.toggle('ativa', index < valor));
        });

        estrela.addEventListener('mouseout', () => {
            estrelas.forEach((e, index) => e.classList.toggle('ativa', index < notaSelecionada));
        });
    });

    if (enviarBtn) {
        enviarBtn.addEventListener('click', () => {
            const nome = document.getElementById('nome-avaliador')?.value.trim() || 'Cliente Anônimo';
            const comentario = document.getElementById('comentario')?.value.trim();

            if (notaSelecionada === 0) {
                alert('Selecione uma nota de 1 a 5 estrelas.');
                return;
            }

            if (!comentario) {
                alert('Escreva um comentário.');
                return;
            }

            let avaliacoes = JSON.parse(localStorage.getItem('avaliacoesBorcelle')) || [];
            avaliacoes.push({ 
                nome, 
                nota: notaSelecionada, 
                comentario, 
                data: new Date().toLocaleDateString('pt-BR'),
                resposta: null  
            });
            localStorage.setItem('avaliacoesBorcelle', JSON.stringify(avaliacoes));

            document.getElementById('nome-avaliador').value = '';
            document.getElementById('comentario').value = '';
            notaSelecionada = 0;
            estrelas.forEach(e => e.classList.remove('ativa'));

            carregarAvaliacoes();
            alert('Obrigada pela sua avaliação! ❤️');
        });
    }


    function carregarAvaliacoes() {
        if (!listaAvaliacoes) return;
        
        const avaliacoes = JSON.parse(localStorage.getItem('avaliacoesBorcelle')) || [];
        listaAvaliacoes.innerHTML = '';

        avaliacoes.forEach((av, index) => {
            const div = document.createElement('div');
            div.className = 'avaliacao-item';
            
            let html = `
                <div class="avaliacao-estrelas">${'★'.repeat(av.nota)}${'☆'.repeat(5 - av.nota)}</div>
                <div class="avaliacao-nome">${av.nome} - ${av.data}</div>
                <p class="avaliacao-comentario">"${av.comentario}"</p>
            `;

         

            if (av.resposta) {
                html += `
                    <div class="resposta-cafeteria">
                        <strong>Borcelle Cafeteria:</strong><br>
                        ${av.resposta}
                    </div>
                `;
            } else {
          

                html += `
                    <button class="btn-responder" data-index="${index}">Responder</button>
                    
                    <div class="resposta-form" id="form-resposta-${index}">
                        <textarea placeholder="Escreva sua resposta aqui..." id="texto-resposta-${index}"></textarea>
                        <button class="enviar-resposta" data-index="${index}">Enviar Resposta</button>
                    </div>
                `;
            }

            div.innerHTML = html;
            listaAvaliacoes.appendChild(div);
        });

      
        document.querySelectorAll('.btn-responder').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                const form = document.getElementById(`form-resposta-${index}`);
                form.style.display = form.style.display === 'block' ? 'none' : 'block';
            });
        });

        document.querySelectorAll('.enviar-resposta').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = btn.dataset.index;
                const texto = document.getElementById(`texto-resposta-${index}`).value.trim();
                
                if (!texto) {
                    alert('Escreva uma resposta antes de enviar.');
                    return;
                }


                const avaliacoesAtualizadas = JSON.parse(localStorage.getItem('avaliacoesBorcelle')) || [];
                avaliacoesAtualizadas[index].resposta = texto;
                localStorage.setItem('avaliacoesBorcelle', JSON.stringify(avaliacoesAtualizadas));

                carregarAvaliacoes();
                
                mostrarNotificacao("Resposta enviada com sucesso! ✓");
            });
        });
    }

    carregarAvaliacoes();
});