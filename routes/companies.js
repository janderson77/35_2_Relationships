const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM companies`);

		return res.json({ companies: results.rows });
	} catch (e) {
		next(e);
	}
});

router.get('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const compRes = await db.query(`SELECT * FROM companies WHERE code=$1`, [ code ]);
		const invRes = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`, [ code ]);
		const indRes = await db.query(
			`
		SELECT i.industry
		FROM companies as co
		LEFT JOIN companies_industries as ci
		ON co.code = ci.company_code
		LEFT JOIN industries as i on ci.industry_code = i.code
		WHERE co.code = $1
		`,
			[ code ]
		);

		if (compRes.rows.length === 0) {
			throw new ExpressError(`${code} does not exist.`, 404);
		}

		const company = compRes.rows[0];
		const invoices = invRes.rows;
		const industries = indRes.rows;

		company.invoices = invoices.map((inv) => inv.id);
		company.industries = industries.map((ind) => ind.industry);

		return res.json({
			company: company
		});
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { name, description } = req.body;
		const comp_code = slugify(req.body.code, { separator: '' });
		const code = comp_code.slice(0, 3);
		const results = await db.query(
			`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
			[ code, name, description ]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.patch('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const results = await db.query(
			`UPDATE companies SET name=$2, description=$3 WHERE code = $1 RETURNING code, name, description`,
			[ code, name, description ]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(`Cannot update company with code of ${code}`, 404);
		}
		return res.status(200).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.delete('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(`DELETE FROM companies WHERE code=$1`, [ code ]);
		if (results.rowCount === 0) {
			throw new ExpressError(`Cannot delete company with code of ${code}. Does not exist`, 404);
		}
		return res.send({ msg: 'Deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
