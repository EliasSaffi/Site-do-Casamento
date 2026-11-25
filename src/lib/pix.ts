export type PixRecipient = {key:string;name:string;city:string};
const ascii = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 $%*+\-./:]/g,'').trim();
function field(id:string, value:string) {
  const length = new TextEncoder().encode(value).length;
  if (length > 99) throw new Error('Campo Pix muito longo.');
  return id + String(length).padStart(2,'0') + value;
}
export function crc16(value:string):string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit=0;bit<8;bit++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4,'0');
}
export function validCpf(value:string):boolean {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  for (let size=9;size<=10;size++) {
    const sum = [...value.slice(0,size)].reduce((acc,digit,index)=>acc+Number(digit)*(size+1-index),0);
    const digit = (sum * 10 % 11) % 10;
    if (digit !== Number(value[size])) return false;
  }
  return true;
}
export function parseAmount(value:string):number | null {
  const cleaned = value.trim().replace(/\s/g,'').replace(/^R\$/i,'');
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned.replace(/\./g,'').replace(',','.'))*100);
  return Number.isSafeInteger(cents) && cents >= 1 && cents <= 999999999 ? cents : null;
}
export function buildPix(recipient:PixRecipient, cents:number, txid='***'):string {
  if (!validCpf(recipient.key)) throw new Error('Chave CPF inválida.');
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 999999999) throw new Error('Informe um valor entre R$ 0,01 e R$ 9.999.999,99.');
  if (txid!=='***' && !/^[a-zA-Z0-9]{1,25}$/.test(txid)) throw new Error('Identificador Pix inválido.');
  const name=ascii(recipient.name).slice(0,25), city=ascii(recipient.city).slice(0,15);
  if (!name || !city) throw new Error('Recebedor Pix incompleto.');
  const payload=field('00','01')+field('26',field('00','br.gov.bcb.pix')+field('01',recipient.key))+field('52','0000')+field('53','986')+field('54',(cents/100).toFixed(2))+field('58','BR')+field('59',name)+field('60',city)+field('62',field('05',txid))+'6304';
  return payload+crc16(payload);
}
