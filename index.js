const express = require('express')
const app = express()
app.use(express.urlencoded());
app.use(express.static('static'))

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});

const port = 3000;

const countrySchema = new mongoose.Schema({
    english: {
        type: String,
        required: true
    },
    portuguese: {
        type: String,
        required: true
    }
});

countrySchema.main = 'english';

// forbid incomplete
const snakeSchema = new mongoose.Schema({
    binomial: {
        type: String,
        unique: true,
        required: true
    },
    popular: {
        type: String,
        required: true
    },
    venomous: {
        type: Boolean,
        required: true
    }, 
    region: {
        type: countrySchema,
        required: true
    }
});

snakeSchema.main = 'binomial';

const schemas = [countrySchema, snakeSchema];

schemas.forEach(schema => {
    schema.method('toHTML', function(allowDelete = true) {
        const { endpoint, modelName } = this.constructor;
        let html = Object.keys(this.schema.paths)
            .filter(path => path[0] !== '_')
            .map(path => {
                const value = this[path], id = this._id;
                let inputElement;
                if (this.schema.paths[path] instanceof mongoose.Schema.Types.String) {
                    inputElement = `<div>
                                <span>${path}:</span>
                                <input model='${modelName}' name='${path}' value='${value}'/>
                                <button onclick="updateField('${endpoint}', '${modelName}', '${id}', '${path}')">PATCH</button>
                            </div>`;
                } else if (this.schema.paths[path] instanceof mongoose.Schema.Types.Boolean) {
                    inputElement = `<div>
                                <span>${path}:</span>
                                <input model='${modelName}' name='${path}' value='${value}' type='checkbox' ${value ? 'checked' : ''}/>
                                <button onclick="updateField('${endpoint}', '${modelName}', '${id}', '${path}')">PATCH</button>
                            </div>`;
                } else {
                    inputElement = `<div><span>${path} (schema):</span><div>${value[value.schema.main]/*this[path].toHTML(false)*/}</div></div>`;
                }
                return inputElement;
            })
            .join('<br>\n');
        html = `<div style='padding: 10px; display: inline-flex; flex-direction: column; border: 1px solid black;'>
                    ${html}
                    ${allowDelete ? `<button style='margin-top: 10px;' onclick="deleteDocument('${this.constructor.endpoint}', '${this._id}')">DELETE</button>` : ''}
                </div>`;
        return html;
    });

    schema.static('HTMLForm', function(postUrl) {
        let html = Object.keys(this.schema.paths)
            .filter(path => path[0] !== '_')
            .map(path => {
                if (this.schema.paths[path] instanceof mongoose.Schema.Types.String) {
                    return `<div><span>${path}:</span><input name='${path}'/></div>`;
                } else if (this.schema.paths[path] instanceof mongoose.Schema.Types.Boolean) {
                    return `<div><span>${path} (schema):</span><input name='${path}' type='checkbox' value='true' /></div>`;
                } else {
                    return `<div><span>${path}:</span><input name='${path}'/></div>`;
                }
            })
            .join('<br>\n');
        html = `<form action='${postUrl}' method='post' style='padding: 10px; display: inline-block; border: 1px solid black;'>
                    ${html}
                    <input type="submit" value="POST" />
                </form>`;
        return html;
    });
});

const Snake = mongoose.model('Snake', snakeSchema);
Snake.endpoint = 'snakes';

const Country = mongoose.model('Country', countrySchema);
Country.endpoint = 'countries';

const models = [Snake, Country];


const jQueryHTML = `<script src="https://code.jquery.com/jquery-3.6.0.js"
                        integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk="
                        crossorigin="anonymous"></script><script src='/main.js'></script>`
const wrapperHTML = (element) =>  `<div style='display: inline-flex; flex-direction: column;'>${element}</div>${jQueryHTML}`

app.get('/:model/search=:expression', (req, res) => {
    const { model, expression } = req.params;
    const modelFound = models.find(m => m.endpoint === model);
    modelFound.find({[modelFound.schema.main]: expression}).exec(function(err, results) {
        res.json({ searchParams: req.params, mongo: {[modelFound.schema.main]: expression}, results });
    });
});

app.get('/:model?/:id?', (req, res) => {
    const { model, id } = req.params;
    if (model) {
        const modelFound = models.find(m => m.endpoint === model);
        if (modelFound) {
            const formHTML = ``;
            if (id) {
                modelFound.findOne({_id: id}).exec(function(err, result) {
                    res.send(wrapperHTML(result.toHTML()));
                });
            } else {
                modelFound.find({}).exec(function(err, results) {
                    const resultsHTML = results.map(result => {
                        return `<a href='/${modelFound.endpoint}/${result._id}'>${result[result.schema.main]}</a>`;
                    }).join('<br>\n');
                    
                    res.send(wrapperHTML(resultsHTML + modelFound.HTMLForm(model)));
                });
            }
        } else {
            res.send('Model not found.');
        }
    } else {
        const html = models.map(m => `<a href='/${m.endpoint}'>${m.modelName}</a>`).join('<br>\n');
        res.send(html);
    }
});

app.patch('/:model/:id', (req, res) => {
    const { model, id } = req.params;
    const modelFound = models.find(m => m.endpoint === model);
    modelFound.updateOne({ _id: id }, req.body, function(err, result) {
        res.send(result);
    });
});

app.delete('/:model/:id', (req, res) => {
    const { model, id } = req.params;
    const modelFound = models.find(m => m.endpoint === model);
    modelFound.findByIdAndDelete(id, function(result) {
        res.send(result);
    });
});

app.post('/:model', async (req, res) => {
    const { model } = req.params;

    switch(model) {
        case 'snakes':
            const newSnake = new Snake(req.body);
            newSnake.region = await Country.findOne({english: req.body.region});
            newSnake.save(err => {
                if (err) {
                    res.send('error when saving' + err);
                } else {
                    res.send(`New snake: ${newSnake.binomial} a.k.a. ${newSnake.popular}, from ${newSnake.region.english}. Dangerous? ${newSnake.venomous ? 'Yes' : 'No'}.`);
                }
            });
            break;
        case 'countries':
            const newCountry = new Country(req.body);
            newCountry.save(err => {
                if (err) {
                    res.send('error when saving' + err);
                } else {
                    res.send(`New country: ${newCountry.english} (${newCountry.portuguese}).`)
                }
            })
            break;
        default:
            break;
    }
});

// Delete all documents and says how many have been removed, for each model
app.delete('/', (req, res) => {
    Promise.all(models.map(model => model.deleteMany({})))
    .then(values => {
        const message = values.map((value, index) => 
        `${models[index].modelName}s removed: ${value.deletedCount}`).join('\n');
        res.send(message);
    });
});

// curl -X DELETE http://localhost:3000

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
