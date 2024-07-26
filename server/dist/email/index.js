"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sendMail = void 0;
const util_1 = require("../util");
const nodemailer_1 = __importDefault(require("nodemailer"));
function sendMail(options, EmailConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        //
        const client = nodemailer_1.default.createTransport(EmailConfig);
        if (!client || typeof client.sendMail !== 'function') {
            throw new Error('请传入 mail 客户端');
        }
        const info = yield client.sendMail(options, null);
        return info;
    });
}
exports.sendMail = sendMail;
function sendEmail(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { toUserList = [], html = '', user = '', pass = '', outputJson } = data;
        const EmailConfig = {
            host: 'smtp.exmail.qq.com',
            port: 465,
            secure: true,
            auth: {
                user,
                pass,
            },
        };
        const info = yield sendMail({
            from: `"${user}" <${user}>`,
            to: toUserList.map(item => `${item}@58.com`).join(','),
            subject: `【提测报告】${(0, util_1.DateFormat)()}`,
            html,
        }, EmailConfig);
        return info;
    });
}
exports.sendEmail = sendEmail;
