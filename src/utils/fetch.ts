import got from 'got';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import cookieParser from 'set-cookie-parser';

const COMMON_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    Referer: 'https://www.wenku8.net/',
};

let Cookie =
    'PHPSESSID=7umkhbeoevf9hda5comi5556cuteebhe;PHPSESSID=55a3q02i0911e15th7s8ug1364c82lp2;jieqiUserInfo=jieqiUserId=312317,jieqiUserName=2497360927,jieqiUserGroup=3,jieqiUserVip=0,jieqiUserPassword=05a671c66aefea124cc08b76ea6d30bb,jieqiUserName_un=2497360927,jieqiUserHonor_un=&#x65B0;&#x624B;&#x4E0A;&#x8DEF;,jieqiUserGroupName_un=&#x666E;&#x901A;&#x4F1A;&#x5458;,jieqiUserLogin=1662190862;jieqiVisitInfo=jieqiUserLogin=1662190862,jieqiUserId=312317';

export async function fetch(url: string, encoding = 'gbk'): Promise<cheerio.Root> {
    const res = await got(url, {
        responseType: 'buffer',
        headers: {
            ...COMMON_HEADERS,
            Cookie,
        },
        http2: true,
    });
    return cheerio.load(iconv.decode(Buffer.from(res.body), encoding), { decodeEntities: false });
}

export async function getCookie() {
    try {
        const res = await got.post(
            `https://www.wenku8.net/login.php?do=submit&jumpurl=http%3A%2F%2Fwww.wenku8.net%2Findex.php`,
            {
                responseType: 'buffer',
                body: 'username=2497360927&password=testtest&usecookie=315360000&action=login&submit=%26%23160%3B%B5%C7%26%23160%3B%26%23160%3B%C2%BC%26%23160%3B',
                headers: {
                    ...COMMON_HEADERS,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                http2: true,
            }
        );

        const newCookie = cookieParser(res.headers['set-cookie']!)
            .map(({ name, value }) => `${name}=${value}`)
            .join(';');
        if (newCookie) {
            Cookie = newCookie;
        }
    } catch (error) {
        console.warn('获取 Cookie 失败，将使用默认 Cookie:', (error as Error).message);
    }
}
