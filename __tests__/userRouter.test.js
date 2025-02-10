const { it, expect, describe } = require("@jest/globals");
const request = require("supertest");
const express = require("express");

const app = express();
const userRouter = require("../src/routes/user");
app.use(userRouter);

describe("GET /users", () => {
    it("should respond 200 and json", async () => {
        return request(app)
            .get("/users")
            .expect("Content-Type", /json/)
            .expect(200)
            .then(res => {
                expect(res.statusCode).toBe(200);
            });
    });
});