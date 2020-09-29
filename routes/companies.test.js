process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testComp;
beforeEach(async () => {
	const result = await db.query(
		`INSERT INTO companies (code, name, description) VALUES ('koi', 'Koi Game Mods', 'A video games modding file sharing site') RETURNING code, name, description`
	);
	const inv = await db.query(`SELECT * FROM invoices WHERE comp_code = 'koi'`);

	company = result.rows[0];
	company.invoices = inv.rows;
	testComp = company;
});

afterEach(async () => {
	await db.query(`DELETE FROM companies`);
	await db.query(`DELETE FROM invoices`);
});

afterAll(async () => {
	await db.end();
});

describe('GET /companies', () => {
	test('Get a list of all companies', async () => {
		const res = await request(app).get('/companies');
		expect(res.statusCode).toBe(200);
	});
});

describe('GET /companies/:code', () => {
	test('Get a single company by company code', async () => {
		const res = await request(app).get(`/companies/${testComp.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: testComp });
	});
	test('Returns 404 for invalid company code', async () => {
		const res = await request(app).get(`/companies/boyohboy`);
		expect(res.statusCode).toBe(404);
	});
});

describe('POST /companies', () => {
	test('Adds a single company', async () => {
		const company = {
			code: 'hey',
			name: 'Hey Games',
			description: 'A neato gaming company'
		};
		const res = await request(app).post('/companies').send(company);
		console.log(res.body);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({ company: company });
	});
});

describe('PATCH /companies/:code', () => {
	test('Updates a single company', async () => {
		const res = await request(app).patch('/companies/koi').send({
			name: 'Koi Mods',
			description: 'The best mod site around'
		});
		expect(res.statusCode).toBe(200);
	});
	test('Returns 404 for invalid company code', async () => {
		const res = await request(app).patch(`/companies/boyohboy`).send({
			name: 'Koi Mods',
			description: 'The best mod site around'
		});
		expect(res.statusCode).toBe(404);
	});
});

describe('DELETE /companies/:code', () => {
	test('Deletes a single company', async () => {
		const res = await request(app).delete('/companies/koi');
		expect(res.statusCode).toBe(200);
		expect(res.body.msg).toEqual('Deleted');
	});
});
