const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
function image(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4).fill(255),getContext(){return{getImageData:()=>({data:this.data})};}};}
function black(img,x,y,w,h){for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){const p=(row*img.width+col)*4;img.data[p]=img.data[p+1]=img.data[p+2]=0;}}
function zxing(){
 const ex={};const doc={createElementNS(ns,tag){return{tag,attrs:{},children:[],setAttribute(n,v){this.attrs[n]=Number(v)||v;},setAttributeNS(ns,n,v){this.setAttribute(n,v);},appendChild(child){this.children.push(child);}};}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../../site/vendor/zxing-browser-0.2.1.min.js'),'utf8'),{window:{},document:doc,module:{exports:ex},exports:ex});return ex;
}
function qr(){const svg=new (zxing().BrowserQRCodeSvgWriter)().write('BC2-TESTE-QR-123',360,360);const out=image(Number(svg.attrs.width),Number(svg.attrs.height));for(const rect of svg.children)black(out,rect.attrs.x,rect.attrs.y,rect.attrs.width,rect.attrs.height);return out;}
function ean(){
 const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
 const G=['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
 const code='2000000000015',parity='LLGGLG';let bits='101';
 for(let i=1;i<=6;i++)bits+=(parity[i-1]==='L'?L:G)[Number(code[i])];bits+='01010';
 for(let i=7;i<13;i++)bits+=L[Number(code[i])].replace(/[01]/g,b=>b==='1'?'0':'1');bits+='101';
 const out=image((bits.length+24)*4,240);for(let i=0;i<bits.length;i++)if(bits[i]==='1')black(out,(i+12)*4,25,4,190);return out;
}
function png(img){
 const crc=buffer=>{let n=0xffffffff;for(const byte of buffer){n^=byte;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;};
 const chunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),checksum=Buffer.alloc(4);length.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,checksum]);};
 const hdr=Buffer.alloc(13);hdr.writeUInt32BE(img.width);hdr.writeUInt32BE(img.height,4);hdr[8]=8;hdr[9]=6;
 const raw=Buffer.alloc((img.width*4+1)*img.height);for(let row=0;row<img.height;row++)Buffer.from(img.data.buffer,row*img.width*4,img.width*4).copy(raw,row*(img.width*4+1)+1);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function code128(){const {bits}=require('./code128-bits.json');const out=image((bits.length+24)*3,220);for(let i=0;i<bits.length;i++)if(bits[i]==='1')black(out,(i+12)*3,20,3,180);return out;}
module.exports={zxing,qr,ean,code128,image,png};
