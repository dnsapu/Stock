// tests/2_functional-tests.js
process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../server");
const expect = chai.expect;

chai.use(chaiHttp);

describe("Stock Price Checker - Functional Tests", function () {
  this.timeout(5000);

  let likesOnce;

  it("Viewing one stock: GET /api/stock-prices?stock=GOOG", async () => {
    const res = await chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: "GOOG" });
    expect(res).to.have.status(200);
    expect(res.body).to.have.property("stockData");
    expect(res.body.stockData).to.have.property("stock").that.is.a("string");
    expect(res.body.stockData).to.have.property("price").that.is.a("number");
    expect(res.body.stockData).to.have.property("likes").that.is.a("number");
  });

  it("Viewing one stock and liking it: GET /api/stock-prices?stock=GOOG&like=true", async () => {
    const res = await chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: "GOOG", like: "true" });

    expect(res).to.have.status(200);
    expect(res.body.stockData.stock).to.equal("GOOG");
    expect(res.body.stockData.price).to.be.a("number");
    expect(res.body.stockData.likes).to.be.a("number");
    likesOnce = res.body.stockData.likes;
  });

  it("Viewing the same stock and liking it again: GET /api/stock-prices?stock=GOOG&like=true", async () => {
    const res = await chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: "GOOG", like: "true" });

    expect(res).to.have.status(200);
    expect(res.body.stockData.stock).to.equal("GOOG");
    expect(res.body.stockData.likes).to.equal(likesOnce);
  });

  it("Viewing two stocks: GET /api/stock-prices?stock=GOOG&stock=MSFT", async () => {
    const res = await chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: ["GOOG", "MSFT"] });

    expect(res).to.have.status(200);
    expect(res.body)
      .to.have.property("stockData")
      .that.is.an("array")
      .with.lengthOf(2);

    const [a, b] = res.body.stockData;
    expect(a).to.include.keys("stock", "price", "rel_likes");
    expect(b).to.include.keys("stock", "price", "rel_likes");
    expect(a.stock).to.equal("GOOG");
    expect(b.stock).to.equal("MSFT");
    expect(a.rel_likes).to.equal(-b.rel_likes);
  });

  it("Viewing two stocks and liking them: GET /api/stock-prices?stock=GOOG&stock=MSFT&like=true", async () => {
    const res = await chai
      .request(server)
      .get("/api/stock-prices")
      .query({ stock: ["GOOG", "MSFT"], like: "true" });

    expect(res).to.have.status(200);
    expect(res.body.stockData).to.be.an("array").with.lengthOf(2);

    const [a, b] = res.body.stockData;
    expect(a).to.include.keys("stock", "price", "rel_likes");
    expect(b).to.include.keys("stock", "price", "rel_likes");
    expect(a.rel_likes).to.equal(-b.rel_likes);
  });
});
