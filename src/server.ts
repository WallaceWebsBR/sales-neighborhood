import axios from 'axios' // or const axios = require('axios');
import { load } from 'cheerio'// const { load } = require('cheerio')
import express from 'express' // const express = require('express')
import { Router, Request, Response } from 'express';
import dotenv from 'dotenv-safe'
import cors from 'cors'
dotenv.config()

const app = express()
const route = Router();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 8081

app.use(
    cors({
        origin: '*'
    })
);

export interface Item {
    id: number;
    title?: string;
    price: number | null;
    img?: string;
    link?: string;
}

route.get('/rolo-por-cep/:cep', async (req: Request, res: Response) => {
    const cep = req.params.cep
    const { data: html } = await axios.get(`https://www.olx.com.br/brasil?q=${cep}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
      }
    })
    const $ = load(html)
    const pagination = $('[data-testid = paginationDesktop] > div > ul').find('li').length
    let id = 0;
    let items: Item[] = [];
    for(let i=0; i<pagination; i++){
      console.log(i)
      const { data: html } = await axios.get(`https://www.olx.com.br/brasil?o=${i + 1}&q=${cep}`)
      const $ = load(html)
      const ads = $('#ad-list').children().get()
      ads.forEach(async (data, index) => {
          let singleAd = $(`#ad-list > li:nth-child(${index + 1}) > div > a`);
          if(singleAd.attr('title')){
              let price = $(`#ad-list > li:nth-child(${index + 1}) > div > a`).find('span:contains("R$")').first().text()
              let priceFormated = parseInt(price.replace(/[R$.]+/g,""));
              items.push({
                  id: id++,
                  title: singleAd.attr('title'),
                  price: price.length ? priceFormated : null,
                  img: $(`#ad-list > li:nth-child(${index + 1}) > div > a`).find('img').attr('src'),
                  link: $(`#ad-list > li:nth-child(${index + 1}) > div > a`).attr('href'),
              })
          }
      })
    }
    res.send(items)
})

app.use(route)

app.listen(port, () => {
    console.log(`Server loaded at port ${port}`)
})