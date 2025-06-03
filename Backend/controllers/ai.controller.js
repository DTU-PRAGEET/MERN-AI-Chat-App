import * as aiService from '../services/ai.service.js';

export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const result = await aiService.generateResult(prompt);
        res.status(200).send( result );

    } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
    }
}