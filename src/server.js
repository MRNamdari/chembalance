const http = require("http");

const port = 8080;

const server = http.createServer(async (req, res) => {
  const url = req.url;
  let content;

  if (url === "/") {
    content = await Bun.file("./src/index.html").text();
    res.writeHead(200, { "Content-Type": "text/html" });
  } else if (/\/.*\.ts/g.test(url)) {
    const transpiler = new Bun.Transpiler({
      loader: "ts",
    });

    const code = await Bun.file("./src" + url).text();
    const result = transpiler.scan(code);
    console.log(result);
    content = transpiler.transformSync(code);
    res.writeHead(200, { "Content-Type": "text/javascript" });
  } else {
    content = "404 Not Found";
    res.writeHead(404);
  }

  res.end(content);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
