const readline = require('readline')
const fs = require('fs');

//read Input output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.question('enter the name\n',(name)=>{
console.log(`you entered ${name}`);
rl.close();
})

rl.on('close',()=>{
    console.log('exit');
    process.exit(0);
})

//read file sync
const content = fs.readFileSync('./index.html','utf-8');
console.log(content);

//write file sync
fs.writeFileSync('./index.html',content + ' again')

//read file async
fs.readFile('./index.html','utf-8',(err,data)=>{
//write file async
fs.writeFile('./index.html', data,(err)=>{
    console.log('writed', data)
})
})


