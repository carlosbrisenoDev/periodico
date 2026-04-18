import {Request, Response} from 'express';
import Favorite from './favorites.model.js';


export const isFavorite = async (req: Request, res: Response) => {
	try {
		const { userId, articleId } = req.params;
        
        const isFavorite = !!(await Favorite.findOne({userId, articleId}));
        
		return res.status(200).json({
		    message: "artivulo analizado con exito", isFavorite
		});
	} catch (error) {
		return res.status(500).json({ message: "Error interno del servidor", error });
	}
}