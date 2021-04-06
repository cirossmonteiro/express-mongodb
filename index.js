const express = require('express')
const app = express()
app.use(express.urlencoded());

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
    schema.method('toHTML', function() {
        let html = Object.keys(this.schema.paths)
            .filter(path => path[0] !== '_')
            .map(path => {
                console.log(52, typeof this[path], this[path]);
                if (typeof this[path] === 'object') {
                    return `<div><span>${path} (schema):</span><div>${this[path].toHTML()}</div></div>`;
                } else {
                    return `<div><span>${path}:</span><input value='${this[path]}' readonly/></div>`;
                }
            })
            .join('<br>\n');
        html = `<div style='padding: 10px; display: inline-block; border: 1px solid black;'>${html}</div>`;
        return html;
    });
});

const Snake = mongoose.model('Snake', snakeSchema);
Snake.endpoint = 'snakes';

const Country = mongoose.model('Country', countrySchema);
Country.endpoint = 'countries';

const models = [Snake, Country];

app.get('/:model?/:id?', (req, res) => {
    const { model, id } = req.params;
    if (model) {
        modelFound = models.find(m => m.endpoint === model);
        if (modelFound) {
            if (id) {
                modelFound.findOne({_id: id}).exec(function(err, result) {
                    res.send(result.toHTML());
                });
            } else {
                modelFound.find({}).exec(function(err, results) {
                    res.send(results.map(result => {
                        return `<a href='/${modelFound.endpoint}/${result._id}'>${result[result.schema.main]}</a>`;
                    }).join('<br>\n'));
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
