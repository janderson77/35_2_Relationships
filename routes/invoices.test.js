process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testComp;
let testInv;
beforeEach(async () => {
	const result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ('koi', 'Koi Game Mods', 'A video games modding file sharing site') RETURNING code, name, description`
	);
	const invres = await db.query(`
        INSERT INTO invoices (comp_code, amt) VALUES ('koi', 500)
    `);
	const inv = await db.query(`SELECT * FROM invoices WHERE comp_code = 'koi'`);

	company = result.rows[0];
	company.invoices = inv.rows;
	testComp = company;
	testInv = inv.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
	await db.end();
});

describe('GET /invoices', () => {
	test('Get a list of all invoices', async () => {
		const res = await request(app).get('/invoices');
		expect(res.statusCode).toBe(200);
	});
});

describe('GET /invoices/:id', () => {
	test('Get a single invoices by invoice id', async () => {
		const res = await request(app).get(`/invoices/${testInv.id}`);
		expect(res.statusCode).toBe(200);
	});
	test('Returns 404 for invalid invoice id', async () => {
		const res = await request(app).get(`/invoices/9999999`);
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /invoices', () => {
	test('Adds a single invoice', async () => {
		const invoice = {
			comp_code: 'koi',
			amt: '600'
		};
		const res = await request(app).post('/invoices').send(invoice);
		expect(res.statusCode).toBe(201);
	});
});

describe('PATCH /invoices/:id', () => {
	test('Updates a single invoice', async () => {
		const res = await request(app).patch(`/invoices/${testInv.id}`).send({
			amt: 1000
		});
		expect(res.statusCode).toBe(200);
	});
	test('Returns 404 for invalid invoice id', async () => {
		const res = await request(app).patch(`/invoices/9999999`).send({
			amt: 1000
		});
		expect(res.statusCode).toBe(404);
	});
});

describe('DELETE /invoices/:id', () => {
	test('Deletes a single invoice', async () => {
		const res = await request(app).delete(`/invoices/${testInv.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body.msg).toEqual('Deleted');
	});
});
