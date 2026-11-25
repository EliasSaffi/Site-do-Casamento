import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Heart, Gift, Search, ChevronDown, X, Check, Copy, QrCode, ShieldCheck, CalendarDays, MapPin, Menu, Sparkles, MessageCircle, Download } from 'lucide-react';
import QRCode from 'qrcode';
import giftsData from './data/gifts.json';
import { wedding } from './data/wedding';
import { buildPix, parseAmount } from './lib/pix';

type Present = typeof giftsData[number];
const money = (cents:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const decimal = (cents:number) => (cents/100).toFixed(2).replace('.',',');
const categories = ['Todos os presentes','Vida a dois','O grande dia','Lar, doce lar','Só pela resenha'];
const normalize = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function Botanical({className=''}:{className?:string}) {
  return <svg className={className} viewBox="0 0 180 240" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1"><path d="M25 230C65 167 91 117 119 17M60 171L27 134M79 134L129 110M98 84L74 43M111 42L149 22"/><path d="M27 134C0 131 4 101 8 92C29 100 40 115 27 134ZM60 172C32 178 31 151 34 143C51 147 62 158 60 172ZM79 134C91 104 119 98 137 100C132 118 112 141 79 134ZM98 84C74 86 63 62 65 35C90 42 105 58 98 84ZM111 42C119 17 141 7 164 7C157 29 137 46 111 42ZM40 202C54 177 77 176 91 180C81 197 62 209 40 202Z"/></g><g fill="currentColor" opacity=".14"><ellipse cx="84" cy="63" rx="11" ry="28" transform="rotate(-30 84 63)"/><ellipse cx="108" cy="117" rx="13" ry="29" transform="rotate(65 108 117)"/></g></svg>;
}

function Countdown() {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
  const seconds=Math.max(0,Math.floor((new Date(wedding.date).getTime()-now)/1000));
  const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
  return <section className="countdown" aria-label="Contagem regressiva para o casamento"><div className="countdown-caption"><Heart size={23} strokeWidth={1}/><p>{seconds ? <>Contando os dias<br/><em>para o nosso sim.</em></> : <>O nosso grande dia<br/><em>chegou!</em></>}</p></div><div className="countdown-numbers">{values.map((v,i)=><div className="count-unit" key={i}><span>{String(v).padStart(2,'0')}</span><small>{['dias','horas','minutos','segundos'][i]}</small></div>)}</div><span className="countdown-date">17 DE ABRIL DE 2027</span></section>;
}

function Payment({gift,onClose}:{gift:Present,onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [amount,setAmount]=useState(decimal(gift.amount));
  const [step,setStep]=useState<'amount'|'pix'|'thanks'>('amount');
  const [error,setError]=useState('');
  const [payload,setPayload]=useState('');
  const [qr,setQr]=useState('');
  const [copied,setCopied]=useState(false);
  const [busy,setBusy]=useState(false);
  const alive=useRef(true);
  const copyTimer=useRef<number>();
  const selectedCents=parseAmount(amount);
  useEffect(()=>{
    alive.current=true;
    const current=dialog.current!;
    const previous=document.activeElement as HTMLElement|null;
    current.showModal();
    const priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{alive.current=false;clearTimeout(copyTimer.current);current.close();document.body.style.overflow=priorOverflow;previous?.focus()};
  },[]);
  async function generate(e:React.FormEvent) {
    e.preventDefault();setError('');
    if(selectedCents===null){setError('Digite um valor válido, como 50,00. O mínimo é R$ 0,01.');return}
    setBusy(true);
    try {
      const code=buildPix(wedding.pix,selectedCents,'CASAMENTO'+gift.id.toUpperCase());
      const image=await QRCode.toDataURL(code,{width:600,margin:4,errorCorrectionLevel:'M',color:{dark:'#23364D',light:'#FFFFFF'}});
      if(alive.current){setPayload(code);setQr(image);setStep('pix')}
    } catch {if(alive.current)setError('Não foi possível gerar o Pix. Confira o valor e tente novamente.')}
    finally{if(alive.current)setBusy(false)}
  }
  async function copy() {
    try{await navigator.clipboard.writeText(payload);setCopied(true);copyTimer.current=window.setTimeout(()=>setCopied(false),3500)}
    catch{setError('Selecione e copie o código abaixo para usar no aplicativo do seu banco.')}
  }
  return <dialog ref={dialog} className="payment-dialog" aria-labelledby="payment-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="payment-inner"><button className="icon-button close-button" aria-label="Fechar janela de presente" onClick={onClose}><X size={22}/></button>
    {step==='thanks'?<div className="thank-you"><div className="thank-icon"><Heart size={34} strokeWidth={1}/></div><span className="eyebrow">QUE BOM TER VOCÊ AQUI</span><h2 id="payment-title">Um presente de carinho.</h2><p>Obrigada por fazer parte da nossa história. Seu gesto deixa esse novo capítulo ainda mais especial!</p><p className="signature">Com amor, Elias & Mariana</p><div className="subtle-note">A confirmação do Pix acontece no aplicativo do seu banco. Este site não verifica pagamentos.</div><button className="button primary full" onClick={onClose}>Voltar para os presentes</button></div>:<>
      <span className="eyebrow">UM GESTO, MUITO AMOR</span><h2 id="payment-title">Presenteie os noivos</h2><div className="selected-gift"><img src={gift.image} alt=""/><div><h3>{gift.title}</h3><p>Valor sugerido · {money(gift.amount)}</p></div></div>
      {step==='amount'?<form onSubmit={generate}><label className="amount-label" htmlFor="gift-amount">Escolha o valor que deseja presentear</label><div className="amount-input"><span>R$</span><input autoFocus id="gift-amount" inputMode="decimal" autoComplete="off" value={amount} onChange={e=>{setAmount(e.target.value);setError('')}} aria-describedby={error?'payment-error':'amount-help'} aria-invalid={Boolean(error)}/></div><p className="input-help" id="amount-help">O valor é livre. O carinho é o que conta.</p><div className="quick-values">{[5000,10000,20000,50000].map(value=><button type="button" className={selectedCents===value?'chosen':''} key={value} onClick={()=>{setAmount(decimal(value));setError('')}}>{money(value).replace(',00','')}</button>)}</div>{error&&<p role="alert" id="payment-error" className="error">{error}</p>}<button className="button primary full" type="submit" disabled={busy}><QrCode size={19}/>{busy?'Preparando seu Pix…':'Presentear via Pix'}</button><p className="secure-caption"><ShieldCheck size={15}/>Direto para os noivos, sem intermediários</p></form>:<div className="pix-step"><p className="pix-total">Seu presente de <strong>{money(selectedCents!)}</strong></p><img className="qr-image" src={qr} alt={`QR Code Pix de ${money(selectedCents!)} para Elias Kalil Maniá Saffi`}/><p>Escaneie com o aplicativo do seu banco<br/>ou use o Pix Copia e Cola.</p><div className="recipient"><span>Recebedor</span><strong>Elias Kalil Maniá Saffi</strong><small>{wedding.pix.bank}</small></div><label className="sr-only" htmlFor="pix-code">Código Pix Copia e Cola</label><textarea id="pix-code" readOnly value={payload} rows={2} onFocus={e=>e.target.select()}/><button className="button primary full" onClick={copy}>{copied?<Check size={18}/>:<Copy size={18}/>}<span aria-live="polite">{copied?'Código copiado!':'Copiar código Pix'}</span></button>{error&&<p className="error" role="alert">{error}</p>}<div className="pix-actions"><button onClick={()=>{setStep('amount');setError('');setCopied(false)}}>Alterar valor</button><button onClick={()=>setStep('thanks')}>Já fiz meu Pix</button></div><p className="secure-caption">Confira o nome e o valor no banco antes de confirmar.</p></div>}
      <div className="payment-bottom"><Heart size={15}/><span>Mais importante que o valor é fazer parte da nossa história.</span></div>
    </>}
  </div></dialog>;
}

export default function App() {
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState(categories[0]);
  const [sort,setSort]=useState('original');
  const [selected,setSelected]=useState<Present|null>(null);
  const [menu,setMenu]=useState(false);
  const reduced=useReducedMotion();
  const gifts=useMemo(()=>{
    const list=giftsData.filter(g=>g.available&&(category===categories[0]||g.category===category)&&normalize(g.title+' '+g.category).includes(normalize(query)));
    return list.sort((a,b)=>sort==='asc'?a.amount-b.amount:sort==='desc'?b.amount-a.amount:a.order-b.order);
  },[query,category,sort]);
  const [shareUrl,setShareUrl]=useState('');
  useEffect(()=>setShareUrl(window.location.origin),[]);
  function saveDate(){
    const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Elias e Mariana//Casamento//PT-BR','BEGIN:VEVENT','UID:elias-mariana-20270417@casamento','DTSTAMP:20261125T120000Z','DTSTART:20270417T193000Z','SUMMARY:Casamento de Elias e Mariana',`LOCATION:${wedding.venue}`,'DESCRIPTION:Nosso grande dia. Esperamos você!','END:VEVENT','END:VCALENDAR'].join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='casamento-elias-e-mariana.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const closeMenu=()=>setMenu(false);
  return <><a className="skip-link" href="#principal">Pular para o conteúdo</a><header className="site-header"><div className="header-wrap"><a href="#inicio" className="brand" aria-label="Elias e Mariana, início">E<span>&</span>M<small>17 . 04 . 2027</small></a><button className="icon-button mobile-menu" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="navigation" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button><nav id="navigation" className={menu?'nav open':'nav'} aria-label="Navegação principal"><a href="#inicio" onClick={closeMenu}>O nosso sim</a><a href="#mensagem" onClick={closeMenu}>Uma mensagem</a><a href="#presentes" onClick={closeMenu}>Lista de presentes</a><a href="#como-funciona" onClick={closeMenu}>Como presentear</a><a className="nav-gift" href="#presentes" onClick={closeMenu}><Gift size={17}/>Presentear os noivos</a></nav></div></header>
    <main id="principal"><section id="inicio" className="hero"><div className="hero-copy"><Botanical className="hero-botanical"/><motion.div initial={reduced?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.8}}><span className="eyebrow"><span className="short-line"/> O COMEÇO DO NOSSO PARA SEMPRE</span><h1>Elias <span className="ampersand">&</span><br/><em>Mariana</em></h1><div className="hero-date"><span>17</span><span>ABRIL<br/>2027</span><i/><span className="hero-time">SÁBADO, ÀS 16H30</span></div><p>Uma vida inteira de amor.<br/>E muitas histórias boas para contar.</p><a className="button primary" href="#presentes"><Gift size={18}/>Conheça nossa lista</a><div className="hero-footnote"><Heart size={13}/> Feita com carinho. E uma pitada de humor.</div></motion.div></div><div className="hero-photo"><img src={wedding.couplePhoto||'/images/celebracao.webp'} alt={wedding.couplePhoto?'Elias e Mariana':'Inspiração de casamento: flores brancas, velas e detalhes em azul serenity e dourado'}/><div className="photo-border"/><div className="photo-caption"><span>JUNTOS, O MELHOR DA VIDA.</span><p>Que seja leve.<br/><em>Que seja nosso.</em></p><Heart size={21} strokeWidth={1}/></div><span className="photo-note">{wedding.couplePhoto?'ELIAS & MARIANA':'UM POUQUINHO DO NOSSO CLIMA'}</span></div></section>
    <Countdown/>
    <section id="mensagem" className="welcome section-wrap"><div className="ornament"><span/><Heart size={17} strokeWidth={1}/><span/></div><span className="eyebrow">PARA QUEM FAZ PARTE DA NOSSA HISTÓRIA</span><h2>O amor é verdadeiro. O casamento é sério.<br/>Já a nossa lista de presentes… <em>nem tanto!</em></h2><p>Preparamos uma seleção de presentes especiais: alguns úteis, outros completamente<br className="desktop-break"/> questionáveis, mas todos escolhidos com muito carinho e bom humor.</p><p>Escolha o seu favorito e contribua com o valor que desejar para essa nova etapa das nossas vidas.</p><span className="signature">Com amor, Elias e Mariana</span></section>
    <section id="presentes" className="catalog section-wrap"><div className="catalog-heading"><div><span className="eyebrow">COM AMOR E BOM HUMOR</span><h2>Nossa lista de <em>presentes</em></h2><p>Presentes inesquecíveis para um casamento inesquecível.</p></div><div className="free-value"><Heart size={18} strokeWidth={1.5}/><span>O presente é simbólico.<br/><strong>O valor fica por sua conta.</strong></span></div></div>
      <div className="catalog-tools"><label className="search"><Search size={19}/><input type="search" placeholder="Encontre um presente (ou uma boa risada)" aria-label="Pesquisar presentes" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button className="icon-button" aria-label="Limpar pesquisa" onClick={()=>setQuery('')}><X size={17}/></button>}</label><div className="sort"><label htmlFor="sort">Ordenar por:</label><select id="sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="original">Nossa seleção</option><option value="asc">Menor valor</option><option value="desc">Maior valor</option></select><ChevronDown size={15}/></div></div>
      <div className="category-tabs" aria-label="Filtrar por categoria">{categories.map(c=><button key={c} aria-pressed={category===c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c===categories[0]&&<Gift size={15}/>} {c}</button>)}</div><p className="results-count" aria-live="polite">{gifts.length} {gifts.length===1?'ideia para presentear':'ideias para presentear'} <span>· Cada uma com a nossa cara</span></p>
      <div className="gift-grid">{gifts.map((gift)=><motion.article layout={!reduced} key={gift.id} className="gift-card"><div className={'gift-image image-'+gift.id}><img src={gift.image} alt={gift.title} loading="lazy" width="1080" height="1080"/><span className="gift-category">{gift.category}</span></div><div className="gift-body"><span className="gift-badge">{gift.badge}</span><h3>{gift.title}</h3><div className="gift-price"><span>Valor sugerido</span><strong>{money(gift.amount)}</strong></div><button className="button gift-button" onClick={()=>setSelected(gift)} aria-label={`Presentear: ${gift.title}`}><Gift size={17}/>Presentear<Heart className="button-heart" size={16}/></button></div></motion.article>)}</div>
      {gifts.length===0&&<div className="empty-state"><Search size={32} strokeWidth={1}/><h3>Nenhum presente por aqui… ainda.</h3><p>Tente outra palavra ou explore toda a nossa lista.</p><button className="button primary" onClick={()=>{setQuery('');setCategory(categories[0])}}>Ver todos os presentes</button></div>}
      <div className="catalog-note"><Sparkles size={17}/><p>Sem lista de compras, sem frete, sem complicação. Só um gesto de carinho para o nosso novo capítulo.</p></div>
    </section>
    <section id="como-funciona" className="how-section"><div className="section-wrap"><span className="eyebrow">SIMPLES COMO UM GESTO DE CARINHO</span><h2>Um presente. <em>Mil sorrisos.</em></h2><div className="steps"><div><span className="step-icon"><Gift size={28} strokeWidth={1.2}/></span><h3>Escolha uma boa risada</h3><p>Encontre aquele presente que tem<br/>tudo a ver com você. Ou com a gente.</p></div><div><span className="step-icon"><Heart size={28} strokeWidth={1.2}/></span><h3>Presenteie do seu jeito</h3><p>Use o valor sugerido ou escolha outro.<br/>Todo carinho é bem-vindo.</p></div><div><span className="step-icon"><QrCode size={28} strokeWidth={1.2}/></span><h3>Envie um Pix e pronto</h3><p>Escaneie o QR Code ou copie o código.<br/>O presente chega direto aos noivos.</p></div></div><p className="how-note"><ShieldCheck size={16}/> Sem cadastro e sem intermediários.</p></div></section>
    <section className="details-section section-wrap"><div className="day-card"><span className="eyebrow">GUARDE ESSE DIA NO CORAÇÃO</span><h2>Nos vemos no <em>altar.</em></h2><p><CalendarDays size={19}/>17 de abril de 2027 · 16h30</p><p><MapPin size={19}/>{wedding.venue}</p><button className="button outline" onClick={saveDate}><Download size={17}/>Salvar a data</button><Botanical className="day-botanical"/></div><div className="faq"><span className="eyebrow">PARA NÃO FICAR NENHUMA DÚVIDA</span><h2>Antes de <em>presentear</em></h2><details><summary>Esses presentes são de verdade?<ChevronDown size={18}/></summary><p>As ideias são simbólicas e cheias de humor. Não há compra ou entrega de produtos. Sua contribuição em dinheiro ajuda a começar a nossa vida a dois.</p></details><details><summary>Preciso contribuir com o valor sugerido?<ChevronDown size={18}/></summary><p>O valor é totalmente livre! Na janela de cada presente, você pode manter a sugestão ou digitar quanto quiser, a partir de R$ 0,01.</p></details><details><summary>Como sei que o Pix foi enviado?<ChevronDown size={18}/></summary><p>Confira o comprovante no aplicativo do seu banco. O site gera o código Pix e não confirma pagamentos automaticamente. Antes de concluir, confira o recebedor: Elias Kalil Maniá Saffi, Nubank.</p></details><details><summary>Posso escolher um presente que alguém já deu?<ChevronDown size={18}/></summary><p>Sim! Os presentes são simbólicos e podem receber quantas contribuições você desejar. Aqui, carinho não tem estoque.</p></details></div></section>
    <section className="closing"><Botanical className="closing-branch"/><Heart size={26} strokeWidth={1}/><h2>O melhor presente é ter você<br/><em>na nossa história.</em></h2><p>Obrigada por celebrar esse começo com a gente.</p><a className="share-link" href={'https://wa.me/?text='+encodeURIComponent('Elias e Mariana vão se casar! Conheça nossa lista de presentes, feita com amor e bom humor: '+shareUrl)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/>Compartilhar esse carinho</a></section></main>
    <footer><a href="#inicio" className="footer-brand">Elias <span>&</span> Mariana</a><span>17 . 04 . 2027</span><p>Feito com amor <Heart size={12}/>, serenity e um pouco de bom humor.</p></footer><AnimatePresence>{selected&&<Payment key={selected.id} gift={selected} onClose={()=>setSelected(null)}/>}</AnimatePresence></>;
}
