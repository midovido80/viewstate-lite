import assert from 'node:assert/strict';
import test from 'node:test';
import {parseWhatsAppText} from '../src/features/importing/whatsappParser.ts';

test('parses Arabic rental requirement with range and full Kuwait phone',()=>{
  const result=parseWhatsAppText('مطلوب شقة بالفروانية غرفتين وحمامين من 300 إلى 350 د.ك غير مفروش 96550001122');
  assert.equal(result.kind,'requirement');assert.equal(result.propertyType,'apartment');assert.equal(result.area,'الفروانية');
  assert.equal(result.minRent,300);assert.equal(result.maxRent,350);assert.equal(result.bedrooms,2);assert.equal(result.bathrooms,2);
  assert.equal(result.furnishing,'unfurnished');assert.equal(result.phone,'96550001122');assert.deepEqual(result.missing,[]);
});

test('parses offered property with PACI and Google Maps link',()=>{
  const result=parseWhatsAppText('متوفر مكتب للإيجار في السالمية إيجار 450 د.ك PACI 12345678 https://maps.app.goo.gl/demo');
  assert.equal(result.kind,'property');assert.equal(result.propertyType,'office');assert.equal(result.area,'السالمية');
  assert.equal(result.monthlyRent,450);assert.equal(result.paci,'12345678');assert.match(result.mapUrl,/maps\.app\.goo\.gl/);
});

test('parses English requirement and maps common Kuwait area alias',()=>{
  const result=parseWhatsAppText('Wanted apartment in Salmiya, 2 beds, 1 bath, budget 320-360 KWD');
  assert.equal(result.kind,'requirement');assert.equal(result.area,'السالمية');assert.equal(result.minRent,320);assert.equal(result.maxRent,360);
  assert.equal(result.bedrooms,2);assert.equal(result.bathrooms,1);
});

test('reports missing required values without inventing data',()=>{
  const result=parseWhatsAppText('مطلوب شقة مناسبة لعائلة');assert.equal(result.area,'');assert.equal(result.minRent,null);
  assert.deepEqual(result.missing,['area','rent']);
});
