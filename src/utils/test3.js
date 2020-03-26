import http from 'http'
import * as parser from "@babel/parser";
import {readFileSync, writeFileSync} from "fs";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import prettier from "prettier";

function generateCode(ast) {
  const newCode = generate(ast, {
    comments: true,
  }).code;
  return prettier.format(newCode, {
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
    parser: 'typescript',
    endOfLine: 'crlf'
  });
}

const getExportNamedDeclaration = (funcName, key) => {
  return `
  export async function ${funcName}(data) {
    return request('${key}', {
      method: 'POST',
      data
    });
  }`
}

let fileBody = []
const ast = parser.parse(readFileSync("../service.js", 'utf-8'), {
  sourceType: 'module',
  plugins: ['typescript']
});
traverse(ast, {

  Program({ node }) {
    let { body } = node;
    fileBody = body
  }
});

// 生成文件内容
const setExportFunc = (funcName, url, comment) => {
  let code = parser.parse(getExportNamedDeclaration(funcName, url), {
    sourceType: 'module',
    plugins: ['javascript', 'flowComments']
  }).program.body[0]

  code.leadingComments = [{
    type: "CommentLine",
    value: comment
  }]

  fileBody.push(code)
}

let service_key = 'buildinggroup'
let url_keys = []
http.get('http://10.182.4.68:9011/swagger/schedule.v1/swagger.json', (res) => {

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);

      for (let key in parsedData.paths) {

        let new_key = key.replace('/api/schedule/', '')
        let url_key = new_key.substr(0, new_key.lastIndexOf('/'))
        if (url_keys.indexOf(url_key) === -1) {
          url_keys.push(url_key)
        }

        let funcName = new_key.substring(new_key.lastIndexOf('/')+1)
        if (url_key === service_key) {
          console.log(funcName, key, parsedData.paths[key].post.summary)
          setExportFunc(funcName, key, parsedData.paths[key].post.summary)
        }
      }

      const result = generateCode(ast);
      writeFileSync('../service2.js', result, 'utf-8')
    } catch (e) {
      console.error(e.message);
    }
  });
})
