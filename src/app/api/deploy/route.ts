import { NextRequest, NextResponse } from 'next/server';

const VERCEL_API_URL = 'https://api.vercel.com';

interface DeployRequestBody {
  html: string;
  css?: string;
  projectName: string;
  vercelToken: string;
  vercelTeamId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequestBody = await request.json();
    const { html, css, projectName, vercelToken, vercelTeamId } = body;

    // バリデーション
    if (!vercelToken) {
      return NextResponse.json(
        { success: false, error: 'Vercel Access Tokenが設定されていません' },
        { status: 400 }
      );
    }

    if (!html) {
      return NextResponse.json(
        { success: false, error: 'デプロイするHTMLが指定されていません' },
        { status: 400 }
      );
    }

    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { success: false, error: 'プロジェクト名を入力してください' },
        { status: 400 }
      );
    }

    // プロジェクト名をサニタイズ（小文字、ハイフン区切り）
    const sanitizedName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    if (!sanitizedName) {
      return NextResponse.json(
        { success: false, error: '有効なプロジェクト名を入力してください（英数字とハイフンのみ）' },
        { status: 400 }
      );
    }

    // デプロイするファイルを準備
    // HTMLが完全なドキュメントでない場合、ラップする
    let finalHtml = html;
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
      finalHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${css ? `<style>${css}</style>` : ''}
</head>
<body>
${html}
</body>
</html>`;
    }

    // Vercel Deployments APIを使用
    // ファイルをBase64エンコード
    const indexHtmlBase64 = Buffer.from(finalHtml).toString('base64');

    // デプロイリクエストを構築
    const deployPayload = {
      name: sanitizedName,
      files: [
        {
          file: 'index.html',
          data: indexHtmlBase64,
          encoding: 'base64',
        },
      ],
      projectSettings: {
        framework: null, // 静的サイト
      },
      target: 'production',
    };

    // Team IDがある場合はクエリパラメータに追加
    const teamQuery = vercelTeamId ? `?teamId=${vercelTeamId}` : '';
    const deployUrl = `${VERCEL_API_URL}/v13/deployments${teamQuery}`;

    console.log('[Deploy API] Deploying to Vercel...');
    console.log('[Deploy API] Project name:', sanitizedName);

    const response = await fetch(deployUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${vercelToken}`,
      },
      body: JSON.stringify(deployPayload),
    });

    const data = await response.json();

    console.log('[Deploy API] Vercel response status:', response.status);

    if (!response.ok) {
      console.error('[Deploy API] Vercel API error:', JSON.stringify(data));

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Vercel Access Tokenが無効です。設定を確認してください。' },
          { status: 401 }
        );
      }

      if (data.error?.code === 'forbidden') {
        return NextResponse.json(
          { success: false, error: 'このプロジェクトへのアクセス権限がありません。Team IDを確認してください。' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { success: false, error: data.error?.message || `Vercel API Error: ${response.status}` },
        { status: response.status }
      );
    }

    // デプロイ成功
    const deploymentUrl = data.url ? `https://${data.url}` : null;
    const deploymentId = data.id;

    console.log('[Deploy API] Deployment successful:', deploymentUrl);

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      deploymentId,
    });
  } catch (error) {
    console.error('[Deploy API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
