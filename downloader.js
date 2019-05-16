const fetch = require('node-fetch');
const fs = require('fs');
const url = require('url');
const path = require('path');
const program = require('child_process');
const io = require('readline').createInterface(
{
    input: process.stdin,
    output: process.stdout
});

const { promisify } = require('util');
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

const folder = './downloads';

const start = async _ =>
{
    console.log("If you can't paste with Ctrl+V, try right clicking.\n");
    if(!await exists(folder))
        await mkdir(folder);
    
    download();
}

const input = variable => new Promise(resolve => 
    io.question(`Enter ${variable}: `, input => resolve(input)));

const extension = link => path.extname(url.parse(link).pathname);

const prompt = async variable => 
{
    const value = await input(variable);
    if(!value)
    {
        console.log(`\nPlease enter the ${variable}.\n`);
        return prompt(variable);
    }

    if(variable === 'link')
    {
        const filetype = extension(value);
        if(!filetype || filetype === '')
        {
            console.log('\nThe link is not a file.\n');
            return download();
        }
    }
    
    if(variable === 'filename')
    {
        try 
        {
            if((await readdir(folder)).some(file => 
                path.parse(file).name === value))
            {
                console.log('\nThat filename is already used.\n');
                return prompt(variable);
            }
        }
        catch(e) { error(); }
    }

    return value;
}

const download = async _ =>
{
    try 
    {
        const link = await prompt('link');
        const filename = await prompt('filename');
        const filetype = extension(link);

        const image = await fetch(link)
        const file = fs.createWriteStream(`${folder}\\${filename}${filetype}`);
        const stream = image.body.pipe(file);
        stream.on('open', _ => console.log('\nDownloading File...\n'));
        stream.on('error', _ => error());
        stream.on('finish', _ =>
        {
            console.log('\033[2J');
            console.log('File Downloaded.\n');
            program.exec(`start downloads`);
            return download();
        });
    }
    catch(e) { error(); }
};

const error = _ =>
{ 
    console.log('\nWoops. An error occurred.\n');
    return download();
}

module.exports = start;