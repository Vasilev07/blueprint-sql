import bcrypt from 'bcrypt';

const hashPassword = async(password: string): Promise<string> =>  {
    const saltRounds = 10;

    return await bcrypt.hash(password, saltRounds);
}

const comparePasswords = async(password: string, hash: any): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}

export const CryptoService = {
    hashPassword,
    comparePasswords
};