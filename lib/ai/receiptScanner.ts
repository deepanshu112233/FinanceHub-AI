import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ReceiptData {
    amount: number;
    date: Date;
    description: string;
    category: string;
    merchantName: string;
}

export async function scanReceipt(file: File): Promise<ReceiptData> {
    try {
        // console.log('🔍 Starting receipt scan...');
        // console.log('📄 File details:', { name: file.name, type: file.type, size: file.size });

        // Check API key
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY is not set');
            throw new Error('GEMINI_API_KEY is not configured');
        }
        // console.log('✅ API key is present');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString('base64');
        // console.log('✅ File converted to base64, length:', base64String.length);

        const prompt = `
            Analyze this receipt and extract JSON with:
            - amount (number)
            - date (ISO format)
            - description (brief summary)
            - merchantName (store name)
            - category (one of: Food, Travel, Groceries, Rent_utilities, Personal_utilities, Other)
            
            Return ONLY valid JSON in this exact format, no markdown or extra text:
            {"amount":number,"date":"ISO","description":"string","merchantName":"string","category":"string"}
            If not a receipt, return {}
        `;

        // console.log('📤 Sending request to Gemini API...');
        const result = await model.generateContent([
            { inlineData: { data: base64String, mimeType: file.type } },
            prompt,
        ]);

        const text = result.response.text();
        // console.log('📥 Raw API Response:', text);

        // Remove markdown code blocks (```json or ```)
        const cleanedText = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
        // console.log('🧹 Cleaned Response:', cleanedText);

        try {
            const data = JSON.parse(cleanedText);
            // console.log('✅ Parsed JSON:', data);

            const receiptData = {
                amount: parseFloat(data.amount) || 0,
                date: data.date ? new Date(data.date) : new Date(),
                description: data.description || '',
                category: data.category || 'Other',
                merchantName: data.merchantName || '',
            };

            // console.log('🎉 Final receipt data:', receiptData);
            return receiptData;
        } catch (parseError) {
            console.error('❌ Error parsing JSON:', parseError);
            console.error('❌ Failed to parse text:', cleanedText);
            throw new Error(`Invalid response from Gemini: ${cleanedText.substring(0, 100)}...`);
        }
    } catch (error) {
        console.error('❌ Error scanning receipt:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to scan receipt');
    }
}
