import express from "express"
import fs, { fdatasync } from "fs"
import bodyParser from "body-parser";
import $ from "jquery";
import jsdom from "jsdom";

var posts = [];

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {

    if (posts.length > 0){
        let filesRead = 0;
        let postContents = [];

        for (let i = 0; i < posts.length; i++) {
            let filePath = "./posts/" + posts[i] + ".txt";

            if (fs.existsSync(filePath)) {
                fs.readFile(filePath, "utf-8", (err, data) => {
                    if (err) throw err;

                    postContents.push({
                        cTitle: posts[i],
                        cBody: data
                    })

                    filesRead++;
                    // When all files are read, send the response
                    if (filesRead === posts.length) {
                        res.render("index.ejs", { posts: postContents });
                    }
                });
            } else {
                // If the file doesn't exist, still increase the count to avoid hanging the response
                filesRead++;
                if (filesRead === posts.length) {
                    res.render("index.ejs", { posts: postContents});
                }
            }
        }
    } else {
        res.render("index.ejs", { posts: [] });
    }
});

app.get("/create", (req, res) => {
    const error = req.query.error;
    res.render("create.ejs", { error: error });
})

app.post("/submit", (req, res) => {

    const input = {
        nTitle: req.body["cTitle"],
        nBody: req.body["cBody"]
    }

    if (input.nTitle === "" || input.nBody === "") {
        res.redirect('/create?error=1');
    } else {
        var textData = (input.nTitle + ".txt");

        posts.push(input.nTitle);

        fs.writeFile("./posts/" + textData, input.nBody, (err) => {
            if (err) throw err;
        });

        res.redirect('/');
    }

})

app.get("/edit/:title", (req, res) => {
    const title = req.params.title;
    const filePath = "./posts/" + title + ".txt";

    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, "utf-8", (err, data) => {
            if (err) throw err;
            res.render("edit.ejs", { title: title, body: data });
        });
    } else {
        res.status(404).send("Post not found");
    }
});

app.post("/update/:title", (req, res) => {
    const oldTitle = req.params.title;
    const newTitle = req.body["cTitle"];
    const newBody = req.body["cBody"];
    const oldFilePath = "./posts/" + oldTitle + ".txt";
    const newFilePath = "./posts/" + newTitle + ".txt";

    fs.rename(oldFilePath, newFilePath, (err) => {
        if (err) throw err;

        fs.writeFile(newFilePath, newBody, (err) => {
            if (err) throw err;
            posts = posts.map(post => post === oldTitle ? newTitle : post);
            res.redirect('/');
        });
    });
});

app.post("/delete/:title", (req, res) => {
    const title = req.params.title;
    const filePath = "./posts/" + title + ".txt";

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) throw err;
            posts = posts.filter(post => post !== title);
            res.redirect('/');
        });
    } else {
        res.status(404).send("Post not found");
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });