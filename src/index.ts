const fs = require('fs')
const path = require('path')
const stream = require('stream')
const JSONStream = require('JSONStream')

class CSVSerializer extends stream.Transform {
  private readonly separator = ','

  constructor() {
    super({
      objectMode: true
    })
  }

  initHeader (header: Array<string>) {
    this.push(header.map(value => `"${value}"`).join(this.separator) + '\n')

    return this
  }

  _transform (chunk, encoding, callback) {
    const {
      type,
      name,
      login: {
        username = '',
        password = '',
        uris = [],
      } = {},
      notes = ''
    } = chunk

    if (type === 1) {
      const uri = (Array.isArray(uris) && uris.length > 0 && typeof uris[0].uri === 'string') ? uris[0].uri : ''

      this.push([
        `"Bitwarden"`,
        `"${name}"`,
        `"${username}"`,
        `"${password}"`,
        `"${uri}"`,
        `"${notes}"`
      ].join(this.separator) + '\n')
    }

    callback()
  }
}

const parseArguments = (args: Array<string>) => {
  const [,, inputFileName] = args

  return {
    inputFileName
  }
}

const validateArguments = (inputFileName: any) => {
  if (typeof inputFileName !== 'string' || !inputFileName.length) {
    throw new Error('Example usage: npm run start data/bitwarden-export.json')
  }
}

const main = (args: Array<string>) => {
  const {inputFileName} = parseArguments(args)
  validateArguments(inputFileName)

  const csvSerializer = new CSVSerializer()

  fs.createReadStream(path.join(__dirname, '..', 'input', inputFileName))
    .pipe(JSONStream.parse('items.*'))
    .pipe(csvSerializer.initHeader(['Group','Title','Username','Password','URL','Notes']))
    .pipe(fs.createWriteStream(path.join(__dirname, '..', 'output', inputFileName.replace('.json', '.csv'))))
}

main(process.argv)
