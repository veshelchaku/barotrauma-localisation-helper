const fs = require('fs-extra');
const convert = require('xml-js');
const { create } = require('xmlbuilder2');
const formatXml = require('xml-formatter');
const { program } = require('commander');

program
  .option('-p, --path <value>', 'input file path')
  .option('-op, --outputPath <value>', 'output file path')
  .option('-l, --language <value>', 'language for output xml')
  .option('-tn, --translatedname <value>', 'translatedname for output xml');

program.parse(process.argv)

const getJson = async () => {
    if(!program.opts().path) {
        console.log('Please specify path parameter using -p or --path');
    }
    const file = await fs.readFile(program.opts().path, 'utf8')
    const data = convert.xml2js(file, {compact: true, spaces: 4});
    return data;
}

const getXml = (elements) => {
    const xml = create({ version: '1.0', encoding: 'utf-8' }).ele(
        'infotexts', {
        language: program.opts().language || 'English',
        nowhitespace: 'false',
        translatedname: program.opts().translatedname || 'English',
    }).up();

    elements.map(e => {
        xml.root().ele(`entityname.${e.id}`).txt(e.name).up();
        e.description && xml.root().ele(`entitydescription.${e.id}`).txt(e.description).up();
    })

    xml.end({ prettyPrint: true });

    return xml;
}

getJson().then(res => {
    const {Items: {Item}} = res;
    const localeData = Item.map(item => ({
        id: item._attributes.identifier,
        name: item._attributes.name,
        ...(item._attributes.description && { description: item._attributes.description }),
    }))

    const xml = getXml(localeData);

    fs.writeFile(program.opts().outputPath || './res.xml', formatXml(xml.toString(), {collapseContent: true}), (err) => err && console.error(err));
});