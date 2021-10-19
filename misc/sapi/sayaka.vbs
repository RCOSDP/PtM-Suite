Set sapi = CreateObject("SAPI.SpVoice")
Set cat  = CreateObject("SAPI.SpObjectTokenCategory")
cat.SetID "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices", False
For Each token In cat.EnumerateTokens
    If token.GetAttribute("Name") = "Microsoft Sayaka" Then
        Set oldv = sapi.Voice
        Set sapi.Voice = token
        sapi.Speak "ご当地グルメ「浜松餃子」が有名な浜松市は、去年1年間の1世帯当たりのギョーザの購入額が3766円となり、ライバルの宇都宮市を73円上回って2年ぶりに日本一の座を奪還しました。"
        Set sapi.Voice = oldv
        Exit For
    End If
Next
