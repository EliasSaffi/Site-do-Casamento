import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPix, crc16, parseAmount, validCpf } from '../src/lib/pix.ts';
import { wedding } from '../src/data/wedding.ts';
function decodeFields(payload:string){
  const result:Record<string,string>={};let offset=0;
  while(offset<payload.length){const id=payload.slice(offset,offset+2),size=Number(payload.slice(offset+2,offset+4));assert.ok(size>0);const value=payload.slice(offset+4,offset+4+size);assert.equal(value.length,size);result[id]=value;offset+=4+size}
  assert.equal(offset,payload.length);return result;
}
test('CRC16-CCITT-FALSE matches its reference check vector',()=>assert.equal(crc16('123456789'),'29B1'));
test('Brazilian amounts retain cents and reject ambiguous or invalid values',()=>{
  for(const [input,cents] of [['207,23',20723],['20.809,49',2080949],['0,01',1],['50',5000],['R$ 100,00',10000]] as const)assert.equal(parseAmount(input),cents);
  for(const input of ['','-5','0','1,234','100.00','abc','Infinity','1e3','0,001','10000000'])assert.equal(parseAmount(input),null);
});
test('Recipient CPF check digits are valid; invalid and repeated digits fail',()=>{
  assert.equal(validCpf(wedding.pix.key),true);
  assert.equal(validCpf('00000000000'),false);assert.equal(validCpf(wedding.pix.key.slice(0,-1)+'0'),false);
});
test('Generated BR Code has parseable TLV fields and correct recipient, amount and checksum',()=>{
  for(const cents of [1,4383,20723,2080949]){
    const code=buildPix(wedding.pix,cents,'CASAMENTOTESTE');const fields=decodeFields(code);
    assert.equal(fields['00'],'01');assert.equal(fields['53'],'986');assert.equal(fields['58'],'BR');assert.equal(fields['54'],(cents/100).toFixed(2));
    assert.equal(decodeFields(fields['26'])['00'],'br.gov.bcb.pix');assert.equal(decodeFields(fields['26'])['01'],wedding.pix.key);
    assert.equal(decodeFields(fields['62'])['05'],'CASAMENTOTESTE');assert.ok(fields['59'].length<=25);assert.ok(fields['60'].length<=15);
    assert.equal(fields['63'],crc16(code.slice(0,-4)));assert.ok(!/[^\x20-\x7E]/.test(code));
  }
});
test('Invalid payment values and identifiers cannot generate a payable code',()=>{
  for(const value of [0,-1,1.5,NaN,Infinity,1000000000])assert.throws(()=>buildPix(wedding.pix,value));
  assert.throws(()=>buildPix({...wedding.pix,key:'123'},100));assert.throws(()=>buildPix(wedding.pix,100,'INVALID-ID'));
});
