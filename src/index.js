const { Readable, Transform, Writable } = require('stream');
const fs = require('fs');
const EventEmitter = require('events');

class Ui extends Readable {
  constructor(customers) {
    super({ objectMode: true });
    this.customers = customers;
  }

  _read() {
    this.customers.forEach((customer) => {
      this.validateCustomer(customer);
      this.push(customer);
    });
    this.push(null);
  }

  validateCustomer(customer) {
    const requiredFields = ['name', 'email', 'password'];
    const customerKeys = Object.keys(customer);

    if (
      customerKeys.length !== requiredFields.length ||
      !customerKeys.every((field) => requiredFields.includes(field))
    ) {
      throw new Error(
        'Invalid customer object: contains extra or missing fields',
      );
    }

    requiredFields.forEach((field) => {
      if (!customer[field] || typeof customer[field] !== 'string') {
        throw new Error(
          `Invalid customer field: ${field} must be a non-empty string`,
        );
      }
    });
  }
}

class Guardian extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk, encoding, callback) {
    const encryptedCustomer = {
      name: chunk.name,
      email: Buffer.from(chunk.email).toString('hex'),
      password: Buffer.from(chunk.password).toString('hex'),
    };
    callback(null, encryptedCustomer);
  }
}

class Logger extends Transform {
  constructor(db) {
    super({ objectMode: true });
    this.db = db;
  }

  _transform(chunk, encoding, callback) {
    const logEntry = {
      source: 'Guardian',
      payload: chunk,
      created: new Date(),
    };
    this.db.emit('log', logEntry);
    callback(null, chunk);
  }
}

class DB extends EventEmitter {
  constructor() {
    super();
    this.logs = [];
    this.on('log', this.storeLog);
  }

  storeLog(logEntry) {
    this.logs.push(logEntry);
    console.log('DB Log:', logEntry);
  }
}

class AccountManager extends Writable {
  constructor(filePath) {
    super({ objectMode: true });
    this.filePath = filePath;
    this.storage = [];
  }

  _write(chunk, encoding, callback) {
    this.storage.push(chunk);
    fs.writeFile(
      this.filePath,
      JSON.stringify(this.storage, null, 2),
      (err) => {
        if (err) return callback(err);
        callback();
      },
    );
  }
}

const customers = [
  { name: 'Pitter Black', email: 'pblack@email.com', password: 'pblack_123' },
  { name: 'Oliver White', email: 'owhite@email.com', password: 'owhite_456' },
];

const ui = new Ui(customers);
const guardian = new Guardian();
const db = new DB();
const logger = new Logger(db);
const manager = new AccountManager('customers.json');

ui.pipe(guardian).pipe(logger).pipe(manager);
