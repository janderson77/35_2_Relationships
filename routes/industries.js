const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM industries`);
		return res.json({ industries: results.rows });
	} catch (e) {
		return next(e);
	}
});

router.get('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const indRes = await db.query(`SELECT * FROM industries WHERE code=$1`, [ code ]);
		if (indRes.rows.length === 0) {
			throw new ExpressError(`Industry with code ${code} does not exist.`, 404);
		}
		console.log(indRes);
		return res.json({ industry: indRes.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { industry } = req.body;
		const slugcode = slugify(industry);
		const code = slugcode.slice(0, 3);
		const result = await db.query(
			`INSERT INTO industries 
        (code, industry)
        VALUES
        ($1, $2)
        RETURNING code, industry`,
			[ code, industry ]
		);
		if (result.rows.length === 0) {
			return new ExpressError('Bad request, please check your data', 400);
		}
		return res.status(201).json(result.rows[0]);
	} catch (e) {
		return next(e);
	}
});

router.patch('/', async (req, res, next) => {
	try {
		const { code } = req.body;
		const { company_code } = req.body;
		const indRes = await db.query(`SELECT * FROM industries WHERE code=$1`, [ code ]);
		const compRes = await db.query(`SELECT * FROM companies WHERE code=$1`, [ company_code ]);
		if (indRes.rows.length === 0) {
			throw new ExpressError(`Industry with code ${code} does not exist.`, 404);
		}
		if (compRes.rows.length === 0) {
			throw new ExpressError(`Company with code ${code} does not exist.`, 404);
		}

		const insert = await db.query(
			`
        INSERT INTO companies_industries
        (company_code, industry_code)
        VALUES ($1, $2)
        RETURNING company_code, industry_code
        `,
			[ company_code, code ]
		);

		return res.status(201).json(insert.rows[0]);
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
