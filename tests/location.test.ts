import assert from 'node:assert/strict';
import test from 'node:test';
import {googleMapsUrl,parseCoordinatesFromMapUrl} from '../src/features/properties/location.ts';

test('generated Google Maps link can restore its coordinates',()=>{
  const value=parseCoordinatesFromMapUrl(googleMapsUrl(29.3759,47.9774));
  assert.deepEqual(value,{latitude:29.3759,longitude:47.9774});
});
test('invalid map link does not invent coordinates',()=>assert.equal(parseCoordinatesFromMapUrl('https://maps.app.goo.gl/example'),null));
