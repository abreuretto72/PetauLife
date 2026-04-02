/**
 * auth-callback — Deep-link redirect page for password reset emails.
 * Supabase sends the user here after they click the reset-password link.
 * This page immediately deep-links into the auExpert app via the
 * custom scheme `auexpert://reset-password#<token_hash>`.
 * After 3 s it shows a manual fallback button if the app didn't open.
 */

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>auExpert</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0F1923;color:#E8EDF2;font-family:'Segoe UI',Roboto,sans-serif;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .card{background:#162231;border:1px solid #1E3248;border-radius:24px;
          padding:40px 32px;max-width:420px;width:100%;text-align:center}
    .logo{font-size:26px;font-weight:800;margin-bottom:24px;letter-spacing:-0.5px}
    .logo span.au{color:#E8EDF2}
    .logo span.expert{color:#E8813A}
    h1{font-size:20px;margin-bottom:8px}
    p{font-size:14px;color:#8FA3B8;line-height:22px;margin-bottom:24px}
    .btn{display:inline-block;background:#E8813A;color:#fff;font-size:16px;
         font-weight:700;padding:14px 40px;border-radius:14px;text-decoration:none;margin-bottom:16px}
    .btn:hover{background:#F09A56}
    .spinner{width:32px;height:32px;border:3px solid #1E3248;border-top-color:#E8813A;
             border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 20px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .hint{font-size:11px;color:#5E7A94}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo"><span class="au">au</span><span class="expert">Expert</span></div>

    <div id="loading">
      <div class="spinner"></div>
      <h1>Abrindo o app...</h1>
      <p>Estamos te levando de volta para o auExpert.</p>
    </div>

    <div id="fallback" style="display:none">
      <h1>Quase lá!</h1>
      <p>Se o app não abriu automaticamente, toque no botão abaixo.</p>
      <a href="#" id="deeplink" class="btn">Abrir auExpert</a>
      <br>
      <p class="hint">Se não funcionar, abra o app manualmente e faça login com sua nova senha.</p>
    </div>
  </div>

  <script>
    !function(){
      var h = window.location.hash.substring(1);
      if (!h) h = window.location.search.substring(1);
      var deeplink = "auexpert://reset-password";
      if (h) deeplink += "#" + h;
      document.getElementById("deeplink").href = deeplink;
      setTimeout(function(){ window.location.href = deeplink; }, 500);
      setTimeout(function(){
        document.getElementById("loading").style.display = "none";
        document.getElementById("fallback").style.display = "block";
      }, 3000);
    }();
  </script>
</body>
</html>`;

Deno.serve((_req) => new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
