const express = require('express');
const ExpressError = require('../expressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM invoices`);

		return res.json({ invoices: results.rows });
	} catch (e) {
		next(e);
	}
});

router.get('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(`SELECT * FROM invoices WHERE id=$1`, [ id ]);

		return res.json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [
			comp_code,
			amt
		]);
		if (results.rowCount === 0) {
			console.log(results);
		}
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

router.patch('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt } = req.body;

		if (amt === 0) {
			const results = await db.query(
				`UPDATE invoices SET paid=true, paid_date=current_date WHERE id = $1 RETURNING *`,
				[ id ]
			);
			if (results.rows.length === 0) {
				throw new ExpressError(`Cannot update invoice with id of ${id}`, 404);
			}
			return res.status(200).json({ invoice: results.rows[0] });
		} else {
			const results = await db.query(`UPDATE invoices SET amt=$2 WHERE id = $1 RETURNING *`, [ id, amt ]);
			if (results.rows.length === 0) {
				throw new ExpressError(`Cannot update invoice with id of ${id}`, 404);
			}
			return res.status(200).json({ invoice: results.rows[0] });
		}
	} catch (e) {
		return next(e);
	}
});

router.delete('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(`DELETE FROM invoices WHERE id=$1`, [ id ]);
		if (results.rowCount === 0) {
			throw new ExpressError(`Cannot delete invoice with id of ${id}. Does not exist`, 404);
		}
		return res.send({ msg: 'Deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
