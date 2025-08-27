const http = require('http')
const fs = require('fs')
//to read the query param from URL
const url = require('url')
//custom event
const user = require('./module/user')

const emitter = new user()
emitter.on('user created',(id,username)=>{
    console.log(`user created with name: ${username} and id: ${id}`)
})
emitter.emit('user created',1.5,'vinoth')

const content = fs.readFileSync('./template/index.html','utf-8');
let Products = fs.readFileSync('./template/product-list.html','utf-8');
const prodData = JSON.parse(fs.readFileSync('./data/product-list.json','utf-8'));
const prodHTML = prodData.map(prod=>{
    let productHTML = Products.replace('{{%IMAGE%}}',prod.productImage);
    productHTML = productHTML.replace('{{%NAME%}}',prod.name);
    productHTML = productHTML.replace('{{%MODELNAME%}}',prod.modeName);
    productHTML = productHTML.replace('{{%MODELNO%}}',prod.modelNumber);
    productHTML = productHTML.replace('{{%SIZE%}}',prod.size);
    productHTML = productHTML.replace('{{%CAMERA%}}',prod.camera);
    productHTML = productHTML.replace('{{%PRICE%}}',prod.price);
    productHTML = productHTML.replace('{{%COLOR%}}',prod.color);
    productHTML = productHTML.replace('{{%ID%}}',prod.id);
    return productHTML;
})

const server = http.createServer();

server.on('request',(req,res)=>{
    
    res.writeHead(200,{'content-type': 'text/html'})
    let {query,pathname: path} = url.parse(req.url,true)
    // res.end(JSON.stringify({
    //     data: 'Welcome'
    // }))
    switch(path.toLowerCase()){
    case "/":
    case '/home':
        res.end(content.replace('{{%CONTENT%}}', 'Welcome Home'));
        break;
    case '/products':
        if(query.id) {
        res.end('Showing details of the product matches '+ query.id)
        } else {
        res.end(content.replace('{{%CONTENT%}}', prodHTML.join('')));
        }
        break;
    default:
        res.writeHead(404,{'content-type': 'text/html'})
        res.end(content.replace('{{%CONTENT%}}', '404 Not Found'));
    }

//read the largecontent 
    // let rs = fs.createReadStream('largecontent file path')
    // rs.on('data',(chunk)=>{
    //     res.write(chunk);
    // })
    // rs.on('end',()=>{
    //     res.end()
    // })
    // rs.on('error',(error)=>{
    //     res.end(error.message)
    // })
//use pipe to avaoid back pressure
    //let rs = fs.createReadStream('largecontent file path')
    //rs.pipe(res)
})

server.listen(8000,'localhost',()=>{
    console.log('server started')
})

server.on('error',(err)=>{
    console.log(err.message)
    server.close()
})

server.on('close',()=>{
    console.log('server clsoed')
})