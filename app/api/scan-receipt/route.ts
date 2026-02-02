import { NextRequest, NextResponse } from 'next/server';
import { scanReceipt } from '@/lib/ai/receiptScanner';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an image or PDF' },
                { status: 400 }
            );
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 });
        }

        const receiptData = await scanReceipt(file);
        // console.log('✅ Receipt scanned successfully:', receiptData);

        return NextResponse.json({ success: true, data: receiptData });
    } catch (error) {
        console.error('❌ API Error scanning receipt:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
        });
        return NextResponse.json(
            { error: 'Failed to scan receipt', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
