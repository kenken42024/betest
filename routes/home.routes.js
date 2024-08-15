import { Router } from 'express'
import { homeIndex } from './../app/controllers/home.controller.js';

const homeRouter = Router()

homeRouter.post(
    '/',
    homeIndex
);

export default homeRouter