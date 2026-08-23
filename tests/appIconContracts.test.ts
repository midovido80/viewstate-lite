import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

function png(path:string){
  const bytes=readFileSync(path);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),colorType:bytes[25]};
}

test('V0.5.6 declares the approved standard and adaptive Android icons',()=>{
  const app=JSON.parse(readFileSync('app.json','utf8')).expo;
  assert.equal(app.icon,'./assets/icon.png');
  assert.equal(app.android.adaptiveIcon.foregroundImage,'./assets/adaptive-icon.png');
  assert.equal(app.android.adaptiveIcon.backgroundColor,'#023060');
});

test('launcher icon assets are 1024 square PNGs and adaptive foreground has alpha',()=>{
  const icon=png('assets/icon.png');
  const adaptive=png('assets/adaptive-icon.png');
  assert.deepEqual([icon.width,icon.height],[1024,1024]);
  assert.deepEqual([adaptive.width,adaptive.height],[1024,1024]);
  assert.ok(adaptive.colorType===4||adaptive.colorType===6,'adaptive icon must include an alpha channel');
});
