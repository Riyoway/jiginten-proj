# Documentation

このディレクトリは、単なるライブラリ一覧ではなく「なぜこの構成にしたか」「固定APIしかない状態でどこに工数を使うべきか」を残すための設計資料です。

読む順番:

1. `STACK.md`
2. `API-INTEGRATION.md`
3. `ARCHITECTURE.md`
4. `FRONTEND-UX.md`
5. `LIMITATIONS.md`
6. `DEVELOPMENT.md`

バックエンドが固定されているため、このプロジェクトではサーバー機能を推測して増やすのではなく、既存の4系統のI/Oを安全にラップし、プレイヤー・リアルタイムUI・レスポンシブ・アクセシビリティ・テストに集中します。
